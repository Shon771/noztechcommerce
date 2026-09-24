import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'E_WALLET'
  | 'QRIS'
  | 'COD';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createPendingPayment(
    orderId: string,
    method: PaymentMethod,
  ) {
    const order =
      await this.prisma.order.findUnique({
        where: {
          id: orderId,
        },
      });

    if (!order) {
      throw new Error(
        'Pesanan tidak ditemukan.',
      );
    }

    return this.prisma.payment.create({
      data: {
        orderId,
        amount: order.total,
        method,
        status: 'PENDING',
      },
    });
  }

  async findByOrderId(
    orderId: string,
  ) {
    return this.prisma.payment.findUnique({
      where: {
        orderId,
      },
      include: {
        order: true,
      },
    });
  }

  async markAsPaid(
    paymentId: string,
    transactionId?: string,
  ) {
    return this.prisma.payment.update({
      where: {
        id: paymentId,
      },
      data: {
        status: 'PAID',
        transactionId: transactionId ?? null,
        paidAt: new Date(),
      },
    });
  }

 async confirmPayment(
  paymentId: string,
  transactionId?: string,
) {
  const payment =
    await this.prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
      include: {
        order: true,
      },
    });

  if (!payment) {
    throw new Error(
      'Pembayaran tidak ditemukan.',
    );
  }

  if (payment.order.status === 'CANCELLED') {
    throw new ConflictException(
      'Pembayaran untuk pesanan yang dibatalkan tidak dapat dikonfirmasi.',
    );
  }

  if (!payment.order.total.equals(payment.amount)) {
  throw new ConflictException(
    'Nominal pembayaran tidak sesuai dengan total pesanan.',
  );
}

  if (
    payment.status === 'FAILED' ||
    payment.status === 'EXPIRED' ||
    payment.status === 'REFUNDED'
  ) {
    throw new ConflictException(
      'Pembayaran tidak dapat dikonfirmasi.',
    );
  }

  if (!payment.order.total.equals(payment.amount)) {
  throw new ConflictException(
    'Nominal pembayaran tidak sesuai dengan total pesanan.',
  );
}

  return this.markAsPaid(
    paymentId,
    transactionId,
  );
}

  async markAsFailed(
    paymentId: string,
  ) {
    return this.prisma.payment.update({
      where: {
        id: paymentId,
      },
      data: {
        status: 'FAILED',
      },
    });
  }

  async markAsExpired(
    paymentId: string,
  ) {
    return this.prisma.payment.update({
      where: {
        id: paymentId,
      },
      data: {
        status: 'EXPIRED',
      },
    });
  }
}
