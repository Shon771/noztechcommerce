import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'crypto';

import { PrismaService } from '../../database/prisma.service';
import { DigitalFulfillmentService } from '../fulfillment/digital-fulfillment.service';

type MidtransNotification = {
  order_id: string;
  transaction_id?: string;
  transaction_status: string;
  fraud_status?: string;
  gross_amount: string;
  status_code: string;
  signature_key: string;
};

@Injectable()
export class MidtransWebhookService {
 constructor(
  private readonly prisma: PrismaService,
  private readonly digitalFulfillmentService: DigitalFulfillmentService,
) {}

  private getServerKey(): string {
    const serverKey =
      process.env.MIDTRANS_SERVER_KEY;

    if (!serverKey) {
      throw new Error(
        'MIDTRANS_SERVER_KEY belum dikonfigurasi.',
      );
    }

    return serverKey;
  }

  private createSignature(
    orderId: string,
    statusCode: string,
    grossAmount: string,
  ): string {
    const raw =
      orderId +
      statusCode +
      grossAmount +
      this.getServerKey();

    return createHash('sha512')
      .update(raw)
      .digest('hex');
  }

  verifySignature(data: {
    order_id?: unknown;
    status_code?: unknown;
    gross_amount?: unknown;
    signature_key?: unknown;
  }): void {
    if (
      typeof data.order_id !== 'string' ||
      typeof data.status_code !== 'string' ||
      typeof data.gross_amount !== 'string' ||
      typeof data.signature_key !== 'string'
    ) {
      throw new BadRequestException(
        'Payload Midtrans tidak lengkap.',
      );
    }

    const expectedSignature =
      this.createSignature(
        data.order_id,
        data.status_code,
        data.gross_amount,
      );

    if (
      expectedSignature !== data.signature_key
    ) {
      throw new UnauthorizedException(
        'Signature Midtrans tidak valid.',
      );
    }
  }

  async handleNotification(
    data: MidtransNotification,
  ) {
    // 1. SECURITY CHECK
    this.verifySignature(data);

    // 2. SUCCESS STATUS
    const isSuccessfulTransaction =
      (data.transaction_status === 'capture' ||
        data.transaction_status ===
          'settlement') &&
      data.status_code === '200' &&
      (!data.fraud_status ||
        data.fraud_status.toLowerCase() ===
          'accept');

   if (isSuccessfulTransaction) {
  const result =
    await this.handleSuccessfulPayment(data);

  /**
   * Hanya trigger digital fulfillment
   * ketika payment benar-benar berubah
   * dari PENDING -> PAID.
   *
   * idempotent = true berarti payment
   * sudah PAID sebelumnya atau proses lain
   * lebih dahulu mengubahnya.
   */
  if (!result.idempotent) {
    await this.digitalFulfillmentService
      .deliverDigitalProductsForOrder(
        data.order_id,
      );
  }

  return result;
}

    // 3. OTHER MIDTRANS STATUS
    switch (data.transaction_status) {
      case 'pending':
        return {
          ok: true,
          status: 'PENDING',
          orderId: data.order_id,
        };

      case 'expire':
        return this.handleExpiredPayment(data);

      case 'deny':
      case 'cancel':
      case 'failure':
        return this.handleFailedPayment(data);

        case 'refund':
  return this.handleRefundedPayment(data);

      default:
        return {
          ok: true,
          status: 'IGNORED',
          orderId: data.order_id,
          transactionStatus:
            data.transaction_status,
        };
    }
  }

  /**
   * PAID
   *
   * PENDING -> PAID
   * PENDING -> CONFIRMED
   *
   * Sudah PAID -> idempotent
   * Terminal non-PAID -> reject
   */
  private async handleSuccessfulPayment(
    data: MidtransNotification,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const order =
          await tx.order.findUnique({
            where: {
              orderNumber: data.order_id,
            },
            include: {
              payment: true,
              items: {
                include: {
                  fulfillment: true,
                  product: {
                    include: {
                      digitalProduct: true,
                      supplierProduct: true,
                    },
                  },
                },
              },
            },
          });

        if (!order) {
          throw new BadRequestException(
            'Order Midtrans tidak ditemukan.',
          );
        }

        if (!order.payment) {
          throw new BadRequestException(
            'Payment untuk order tidak ditemukan.',
          );
        }

        // Nominal internal order vs payment
        if (
          !order.total.equals(
            order.payment.amount,
          )
        ) {
          throw new BadRequestException(
            'Nominal Payment tidak sesuai dengan total Order.',
          );
        }

        // Nominal internal order vs Midtrans
        if (
          order.total.toFixed(2) !==
          Number(
            data.gross_amount,
          ).toFixed(2)
        ) {
          throw new BadRequestException(
            'Gross amount Midtrans tidak sesuai dengan total Order.',
          );
        }

        // Sudah PAID -> webhook duplicate
        if (
          order.payment.status === 'PAID'
        ) {
          return {
            ok: true,
            status: 'PAID',
            orderId:
              order.orderNumber,
            transactionId:
              order.payment
                .transactionId ??
              data.transaction_id ??
              null,
            idempotent: true,
          };
        }

        // Jangan hidupkan kembali payment terminal
        if (
          order.payment.status ===
            'EXPIRED' ||
          order.payment.status ===
            'FAILED' ||
          order.payment.status ===
            'REFUNDED'
        ) {
          throw new ConflictException(
            'Payment sudah berada pada status terminal dan tidak dapat diubah menjadi PAID.',
          );
        }

        // Conditional transition:
        // hanya PENDING yang boleh menjadi PAID.
        const updated =
          await tx.payment.updateMany({
            where: {
              id: order.payment.id,
              status: 'PENDING',
            },
            data: {
              status: 'PAID',
              transactionId:
                data.transaction_id ??
                null,
              paidAt: new Date(),
            },
          });

        // Tidak berhasil update berarti state
        // berubah oleh proses lain.
        if (updated.count !== 1) {
          const latestPayment =
            await tx.payment.findUnique({
              where: {
                id: order.payment.id,
              },
            });

          if (!latestPayment) {
            throw new BadRequestException(
              'Payment tidak ditemukan.',
            );
          }

          if (
            latestPayment.status === 'PAID'
          ) {
            return {
              ok: true,
              status: 'PAID',
              orderId:
                order.orderNumber,
              transactionId:
                latestPayment.transactionId ??
                data.transaction_id ??
                null,
              idempotent: true,
            };
          }

          throw new ConflictException(
            `Payment berubah ke status ${latestPayment.status} sebelum konfirmasi berhasil.`,
          );
        }

        // Stage 2B:
        // soldCount hanya bertambah ketika transisi
        // PENDING -> PAID benar-benar berhasil.
        //
        // Fulfillment:
        // - SupplierProduct -> WAITING_SUPPLIER
        // - DigitalProduct milik sendiri -> PENDING
        //   sampai delivery benar-benar terjadi
        // - Produk fisik -> PENDING
        for (const item of order.items) {
          await tx.product.update({
            where: {
              id: item.productId,
            },
            data: {
              soldCount: {
                increment: item.quantity,
              },
            },
          });

          if (item.product.supplierProduct) {
            await tx.fulfillment.update({
              where: {
                orderItemId: item.id,
              },
              data: {
                status: 'WAITING_SUPPLIER',
              },
            });
          } else {
            await tx.fulfillment.update({
              where: {
                orderItemId: item.id,
              },
              data: {
                status: 'PENDING',
              },
            });
          }
        }

        // Hanya PENDING -> CONFIRMED
        if (
          order.status === 'PENDING'
        ) {
          await tx.order.updateMany({
            where: {
              id: order.id,
              status: 'PENDING',
            },
            data: {
              status: 'CONFIRMED',
            },
          });
        }

        return {
          ok: true,
          status: 'PAID',
          orderId:
            order.orderNumber,
          transactionId:
            data.transaction_id ??
            null,
          idempotent: false,
        };
      },
    );
  }

  /**
   * EXPIRED
   *
   * PENDING -> EXPIRED
   * PENDING Order -> CANCELLED
   * CANCELLED -> restore stock
   *
   * Sudah EXPIRED -> idempotent
   */
  private async handleExpiredPayment(
    data: MidtransNotification,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const order =
          await tx.order.findUnique({
            where: {
              orderNumber: data.order_id,
            },
            include: {
              payment: true,
              items: true,
            },
          });

        if (!order) {
          throw new BadRequestException(
            'Order Midtrans tidak ditemukan.',
          );
        }

        if (!order.payment) {
          throw new BadRequestException(
            'Payment untuk order tidak ditemukan.',
          );
        }

        if (
          order.payment.status === 'EXPIRED'
        ) {
          return {
            ok: true,
            status: 'EXPIRED',
            orderId:
              order.orderNumber,
            transactionId:
              order.payment
                .transactionId ??
              data.transaction_id ??
              null,
            idempotent: true,
          };
        }

        if (
          order.payment.status === 'PAID'
        ) {
          throw new ConflictException(
            'Payment sudah PAID dan tidak dapat diubah menjadi EXPIRED.',
          );
        }

        if (
          order.payment.status ===
            'FAILED' ||
          order.payment.status ===
            'REFUNDED'
        ) {
          throw new ConflictException(
            'Payment sudah berada pada status terminal.',
          );
        }

        // Hanya PENDING -> EXPIRED
        const updated =
          await tx.payment.updateMany({
            where: {
              id: order.payment.id,
              status: 'PENDING',
            },
            data: {
              status: 'EXPIRED',
              transactionId:
                data.transaction_id ??
                null,
            },
          });

        if (updated.count !== 1) {
          const latestPayment =
            await tx.payment.findUnique({
              where: {
                id: order.payment.id,
              },
            });

          if (!latestPayment) {
            throw new BadRequestException(
              'Payment tidak ditemukan.',
            );
          }

          if (
            latestPayment.status ===
            'EXPIRED'
          ) {
            return {
              ok: true,
              status: 'EXPIRED',
              orderId:
                order.orderNumber,
              transactionId:
                latestPayment.transactionId ??
                data.transaction_id ??
                null,
              idempotent: true,
            };
          }

          throw new ConflictException(
            `Payment berubah ke status ${latestPayment.status}.`,
          );
        }

        // Hanya order PENDING yang dibatalkan.
        const cancelled =
          await tx.order.updateMany({
            where: {
              id: order.id,
              status: 'PENDING',
            },
            data: {
              status: 'CANCELLED',
            },
          });

        // Hanya proses restore stock jika kita
        // benar-benar berhasil melakukan
        // PENDING -> CANCELLED pada transaction ini.
        if (cancelled.count === 1) {
          for (const item of order.items) {
            await tx.product.update({
              where: {
                id: item.productId,
              },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });

            await tx.fulfillment.updateMany({
              where: {
                orderItemId: item.id,
                status: {
                  not: 'DELIVERED',
                },
              },
              data: {
                status: 'CANCELLED',
              },
            });
          }
        }

        return {
          ok: true,
          status: 'EXPIRED',
          orderId:
            order.orderNumber,
          transactionId:
            data.transaction_id ??
            null,
          idempotent: false,
        };
      },
    );
  }

  /**
   * FAILED
   *
   * PENDING -> FAILED
   * PENDING Order -> CANCELLED
   * CANCELLED -> restore stock
   *
   * Sudah FAILED -> idempotent
   */
  private async handleFailedPayment(
    data: MidtransNotification,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const order =
          await tx.order.findUnique({
            where: {
              orderNumber: data.order_id,
            },
            include: {
              payment: true,
              items: true,
            },
          });

        if (!order) {
          throw new BadRequestException(
            'Order Midtrans tidak ditemukan.',
          );
        }

        if (!order.payment) {
          throw new BadRequestException(
            'Payment untuk order tidak ditemukan.',
          );
        }

        if (
          order.payment.status ===
          'FAILED'
        ) {
          return {
            ok: true,
            status: 'FAILED',
            orderId:
              order.orderNumber,
            transactionId:
              order.payment
                .transactionId ??
              data.transaction_id ??
              null,
            idempotent: true,
          };
        }

        if (
          order.payment.status === 'PAID'
        ) {
          throw new ConflictException(
            'Payment sudah PAID dan tidak dapat diubah menjadi FAILED.',
          );
        }

        if (
          order.payment.status ===
            'EXPIRED' ||
          order.payment.status ===
            'REFUNDED'
        ) {
          throw new ConflictException(
            'Payment sudah berada pada status terminal.',
          );
        }

        // Hanya PENDING -> FAILED
        const updated =
          await tx.payment.updateMany({
            where: {
              id: order.payment.id,
              status: 'PENDING',
            },
            data: {
              status: 'FAILED',
              transactionId:
                data.transaction_id ??
                null,
            },
          });

        if (updated.count !== 1) {
          const latestPayment =
            await tx.payment.findUnique({
              where: {
                id: order.payment.id,
              },
            });

          if (!latestPayment) {
            throw new BadRequestException(
              'Payment tidak ditemukan.',
            );
          }

          if (
            latestPayment.status ===
            'FAILED'
          ) {
            return {
              ok: true,
              status: 'FAILED',
              orderId:
                order.orderNumber,
              transactionId:
                latestPayment.transactionId ??
                data.transaction_id ??
                null,
              idempotent: true,
            };
          }

          throw new ConflictException(
            `Payment berubah ke status ${latestPayment.status}.`,
          );
        }

        // Hanya order PENDING yang dibatalkan.
        const cancelled =
          await tx.order.updateMany({
            where: {
              id: order.id,
              status: 'PENDING',
            },
            data: {
              status: 'CANCELLED',
            },
          });

        // Restore stock hanya jika cancellation
        // benar-benar dilakukan di transaction ini.
        if (cancelled.count === 1) {
          for (const item of order.items) {
            await tx.product.update({
              where: {
                id: item.productId,
              },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });

            await tx.fulfillment.updateMany({
              where: {
                orderItemId: item.id,
                status: {
                  not: 'DELIVERED',
                },
              },
              data: {
                status: 'CANCELLED',
              },
            });
          }
        }

        return {
          ok: true,
          status: 'FAILED',
          orderId:
            order.orderNumber,
          transactionId:
            data.transaction_id ??
            null,
          idempotent: false,
        };
      },
    );
  }

/**
 * REFUNDED
 *
 * PAID -> REFUNDED
 *
 * Sudah REFUNDED -> idempotent
 * PENDING / FAILED / EXPIRED -> reject
 */
private async handleRefundedPayment(
  data: MidtransNotification,
) {
  return this.prisma.$transaction(
    async (tx) => {
      const order =
        await tx.order.findUnique({
          where: {
            orderNumber: data.order_id,
          },
          include: {
            payment: true,
            items: true,
          },
        });

      if (!order) {
        throw new BadRequestException(
          'Order Midtrans tidak ditemukan.',
        );
      }

      if (!order.payment) {
        throw new BadRequestException(
          'Payment untuk order tidak ditemukan.',
        );
      }

      // Duplicate refund notification
      if (
        order.payment.status ===
        'REFUNDED'
      ) {
        return {
          ok: true,
          status: 'REFUNDED',
          orderId:
            order.orderNumber,
          transactionId:
            order.payment.transactionId ??
            data.transaction_id ??
            null,
          idempotent: true,
        };
      }

      // Hanya PAID yang boleh direfund
      if (
        order.payment.status !== 'PAID'
      ) {
        throw new ConflictException(
          `Payment dengan status ${order.payment.status} tidak dapat diubah menjadi REFUNDED.`,
        );
      }

      const updated =
        await tx.payment.updateMany({
          where: {
            id: order.payment.id,
            status: 'PAID',
          },
          data: {
            status: 'REFUNDED',
            transactionId:
              data.transaction_id ??
              order.payment.transactionId ??
              null,
          },
        });

      if (updated.count !== 1) {
        const latestPayment =
          await tx.payment.findUnique({
            where: {
              id: order.payment.id,
            },
          });

        if (!latestPayment) {
          throw new BadRequestException(
            'Payment tidak ditemukan.',
          );
        }

        if (
          latestPayment.status ===
          'REFUNDED'
        ) {
          return {
            ok: true,
            status: 'REFUNDED',
            orderId:
              order.orderNumber,
            transactionId:
              latestPayment.transactionId ??
              data.transaction_id ??
              null,
            idempotent: true,
          };
        }

        throw new ConflictException(
          `Payment berubah ke status ${latestPayment.status}.`,
        );
      }

      // Stage 2D:
      // Refund tidak mengurangi soldCount dan tidak
      // mengembalikan stock, karena order sudah pernah
      // berhasil dibayar.
      //
      // Namun fulfillment yang belum benar-benar delivered
      // tidak boleh tetap berjalan setelah refund.
      for (const item of order.items) {
        await tx.fulfillment.updateMany({
          where: {
            orderItemId: item.id,
            status: {
              not: 'DELIVERED',
            },
          },
          data: {
            status: 'CANCELLED',
          },
        });
      }

      return {
        ok: true,
        status: 'REFUNDED',
        orderId:
          order.orderNumber,
        transactionId:
          data.transaction_id ??
          order.payment.transactionId ??
          null,
        idempotent: false,
      };
    },
  );
}

}