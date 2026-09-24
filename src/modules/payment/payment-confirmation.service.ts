import {
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PaymentConfirmationService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async confirm(
    paymentId: string,
    transactionId?: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const payment =
          await tx.payment.findUnique({
            where: {
              id: paymentId,
            },
            include: {
              order: {
                include: {
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
              },
            },
          });

        if (!payment) {
          throw new Error(
            'Pembayaran tidak ditemukan.',
          );
        }

        // Sudah PAID sebelum proses ini dimulai.
        if (payment.status === 'PAID') {
          throw new ConflictException(
            'Pembayaran sudah dikonfirmasi.',
          );
        }

        // Status terminal tidak boleh dihidupkan kembali.
        if (
          payment.status === 'FAILED' ||
          payment.status === 'EXPIRED' ||
          payment.status === 'REFUNDED'
        ) {
          throw new ConflictException(
            'Pembayaran tidak dapat dikonfirmasi.',
          );
        }

        if (
          payment.order.status ===
          'CANCELLED'
        ) {
          throw new ConflictException(
            'Pesanan yang dibatalkan tidak dapat dikonfirmasi.',
          );
        }

        // Validasi nominal internal.
        if (
          !payment.order.total.equals(
            payment.amount,
          )
        ) {
          throw new ConflictException(
            'Nominal pembayaran tidak sesuai dengan total pesanan.',
          );
        }

        /*
         * CONDITIONAL TRANSITION
         *
         * Hanya PENDING -> PAID yang boleh
         * dianggap sebagai pembayaran baru.
         */
        const updatedPayment =
          await tx.payment.updateMany({
            where: {
              id: payment.id,
              status: 'PENDING',
            },
            data: {
              status: 'PAID',
              transactionId:
                transactionId ?? null,
              paidAt: new Date(),
            },
          });

        /*
         * Kalau gagal update, kemungkinan ada
         * proses lain yang lebih dulu mengubah state.
         *
         * Jangan pernah menaikkan soldCount di sini.
         */
        if (
          updatedPayment.count !== 1
        ) {
          const latestPayment =
            await tx.payment.findUnique({
              where: {
                id: payment.id,
              },
              include: {
                order: true,
              },
            });

          if (!latestPayment) {
            throw new Error(
              'Pembayaran tidak ditemukan.',
            );
          }

          // Proses lain sudah berhasil menjadikannya PAID.
          if (
            latestPayment.status === 'PAID'
          ) {
            return {
              payment: latestPayment,
              order: latestPayment.order,
              idempotent: true,
            };
          }

          throw new ConflictException(
            `Pembayaran berubah ke status ${latestPayment.status} sebelum konfirmasi berhasil.`,
          );
        }

        /*
         * =====================================================
         * SOLD COUNT
         * =====================================================
         *
         * Hanya dijalankan setelah PENDING -> PAID
         * benar-benar berhasil.
         */
        for (
          const item of payment.order.items
        ) {
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

          /*
           * ===================================================
           * FULFILLMENT
           * ===================================================
           *
           * Supplier product:
           *    -> WAITING_SUPPLIER
           *
           * Digital product milik sendiri:
           *    -> PENDING
           *       (delivery aktual dilakukan service berikutnya)
           *
           * Produk fisik:
           *    -> PENDING
           */
          if (
            item.product.supplierProduct
          ) {
            await tx.fulfillment.update({
              where: {
                orderItemId: item.id,
              },
              data: {
                status:
                  'WAITING_SUPPLIER',
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

        /*
         * =====================================================
         * ORDER
         * =====================================================
         *
         * Hanya PENDING -> CONFIRMED.
         */
        let updatedOrder = payment.order;

if (
  payment.order.status ===
  'PENDING'
) {
  await tx.order.update({
    where: {
      id: payment.orderId,
    },
    data: {
      status: 'CONFIRMED',
    },
  });

  const refreshedOrder =
    await tx.order.findUnique({
      where: {
        id: payment.orderId,
      },
      include: {
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

  if (!refreshedOrder) {
    throw new Error(
      'Order tidak ditemukan setelah dikonfirmasi.',
    );
  }

  updatedOrder = refreshedOrder;
}
        return {
          payment:
            await tx.payment.findUnique({
              where: {
                id: payment.id,
              },
            }),
          order: updatedOrder,
          idempotent: false,
        };
      },
    );
  }
}