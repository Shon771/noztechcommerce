import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class DigitalFulfillmentService {
  private readonly logger = new Logger(
    DigitalFulfillmentService.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}

  async deliverDigitalProduct(orderItemId: string) {
    const orderItem =
      await this.prisma.orderItem.findUnique({
        where: {
          id: orderItemId,
        },
        include: {
          order: {
            include: {
              customer: true,
              payment: true,
            },
          },
          product: {
            include: {
              digitalProduct: true,
            },
          },
          fulfillment: true,
        },
      });


    if (!orderItem) {
      throw new NotFoundException(
        'Order item tidak ditemukan.',
      );
    }

    const fulfillment = orderItem.fulfillment;

    if (!fulfillment) {
      throw new NotFoundException(
        'Fulfillment tidak ditemukan.',
      );
    }

    /**
     * Sudah berhasil dikirim.
     * Jangan kirim ulang.
     */
    if (fulfillment.status === 'DELIVERED') {
      this.logger.log(
        `Digital delivery already completed: ${fulfillment.id}`,
      );

      return {
        ok: true,
        idempotent: true,
        status: 'DELIVERED',
        orderItemId,
      };
    }

    /**
     * Sedang diproses oleh request lain.
     * Jangan melakukan duplicate delivery.
     */
    if (fulfillment.status === 'PROCESSING') {
      this.logger.log(
        `Digital delivery already processing: ${fulfillment.id}`,
      );

      return {
        ok: true,
        idempotent: true,
        status: 'PROCESSING',
        orderItemId,
      };
    }

    /**
     * Hanya PENDING yang boleh di-claim
     * sebagai digital fulfillment.
     */
    if (fulfillment.status !== 'PENDING') {
      throw new ConflictException(
        `Fulfillment dengan status ${fulfillment.status} tidak dapat diproses.`,
      );
    }

    /**
     * Payment wajib PAID.
     */
    if (orderItem.order.payment?.status !== 'PAID') {
      throw new ConflictException(
        'Pembayaran belum berstatus PAID.',
      );
    }

    /**
     * Pastikan product mempunyai konfigurasi
     * digital product.
     */
    const digitalProduct =
      orderItem.product.digitalProduct;

    if (!digitalProduct) {
      throw new ConflictException(
        'Produk ini bukan digital product.',
      );
    }

    if (!digitalProduct.isActive) {
      throw new ConflictException(
        'Digital product sedang tidak aktif.',
      );
    }

    if (!digitalProduct.deliveryUrl) {
      throw new ConflictException(
        'Delivery URL belum tersedia.',
      );
    }

    /**
     * Customer wajib memiliki Telegram ID.
     */
    const telegramId =
      orderItem.order.customer.telegramId;

    if (!telegramId) {
      throw new ConflictException(
        'Customer tidak memiliki Telegram ID.',
      );
    }

    const chatId = Number(telegramId);

    if (!Number.isSafeInteger(chatId)) {
      throw new ConflictException(
        'Telegram ID customer tidak valid.',
      );
    }

    /**
     * ATOMIC CLAIM
     *
     * PENDING -> PROCESSING
     *
     * Hanya satu request yang boleh
     * berhasil melakukan claim.
     */
    const claimed =
      await this.prisma.fulfillment.updateMany({
        where: {
          id: fulfillment.id,
          status: 'PENDING',
        },
        data: {
          status: 'PROCESSING',
        },
      });

    if (claimed.count !== 1) {
      const latest =
        await this.prisma.fulfillment.findUnique({
          where: {
            id: fulfillment.id,
          },
        });

      if (latest?.status === 'DELIVERED') {
        return {
          ok: true,
          idempotent: true,
          status: 'DELIVERED',
          orderItemId,
        };
      }

      if (latest?.status === 'PROCESSING') {
        return {
          ok: true,
          idempotent: true,
          status: 'PROCESSING',
          orderItemId,
        };
      }

      throw new ConflictException(
        `Fulfillment dengan status ${
          latest?.status ?? 'UNKNOWN'
        } tidak dapat diproses.`,
      );
    }


    const productName = orderItem.product.name;

    const message =
      `✅ <b>PEMBAYARAN BERHASIL</b>\n\n` +
      `📦 Produk: ${productName}\n` +
      `🧾 Pesanan: ${orderItem.order.orderNumber}\n\n` +
      `🔗 <b>LINK PRODUK</b>\n` +
      `${digitalProduct.deliveryUrl}\n\n` +
      `Terima kasih sudah berbelanja di NozTech Commerce. ❤️`;

    /**
     * Kirim delivery ke Telegram.
     *
     * Jika gagal, kembalikan status ke PENDING
     * agar bisa diproses ulang.
     */
    try {
      await this.telegramService.sendMessage(
        chatId,
        message,
        undefined,
        'HTML',
      );
    } catch (error) {
      await this.prisma.fulfillment.updateMany({
        where: {
          id: fulfillment.id,
          status: 'PROCESSING',
        },
        data: {
          status: 'PENDING',
        },
      });

      this.logger.error(
        `Digital delivery failed for ${orderItem.order.orderNumber}`,
        error instanceof Error
          ? error.stack
          : String(error),
      );

      throw error;
    }

    /**
     * PROCESSING -> DELIVERED
     *
     * Conditional update menjaga consistency
     * jika ada proses lain yang berjalan.
     */
    const delivered =
      await this.prisma.fulfillment.updateMany({
        where: {
          id: fulfillment.id,
          status: 'PROCESSING',
        },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
        },
      });

    if (delivered.count !== 1) {
      throw new ConflictException(
        'Delivery berhasil dikirim tetapi status fulfillment gagal diperbarui.',
      );
    }

    this.logger.log(
      `Digital product delivered successfully: ${orderItem.order.orderNumber}`,
    );

    return {
      ok: true,
      idempotent: false,
      status: 'DELIVERED',
      orderItemId,
      orderNumber:
        orderItem.order.orderNumber,
    };
  }

async deliverDigitalProductsForOrder(
  orderNumber: string,
) {
  const order = await this.prisma.order.findUnique({
    where: {
      orderNumber,
    },
    include: {
      payment: true,
      items: {
        include: {
          product: {
            include: {
              digitalProduct: true,
            },
          },
          fulfillment: true,
        },
      },
    },
  });

  if (!order) {
    throw new NotFoundException(
      'Order tidak ditemukan.',
    );
  }

  if (order.payment?.status !== 'PAID') {
    return {
      ok: true,
      skipped: true,
      reason: 'PAYMENT_NOT_PAID',
      orderNumber,
    };
  }

  const digitalItems = order.items.filter(
    (item) =>
      !!item.product.digitalProduct,
  );

  if (digitalItems.length === 0) {
    return {
      ok: true,
      skipped: true,
      reason: 'NO_DIGITAL_ITEMS',
      orderNumber,
    };
  }

  const results = [];

  for (const item of digitalItems) {
    try {
      const result =
        await this.deliverDigitalProduct(item.id);

      results.push(result);
    } catch (error) {
      this.logger.error(
        `Digital fulfillment failed for ${orderNumber}, orderItem ${item.id}`,
        error instanceof Error
          ? error.stack
          : String(error),
      );

      results.push({
        ok: false,
        orderItemId: item.id,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }

  return {
    ok: results.every((result) => result.ok),
    orderNumber,
    results,
  };
}

}