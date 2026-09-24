import 'dotenv/config';

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import { OrderService } from '../src/modules/order/order.service';
import { PromoService } from '../src/modules/promo/promo.service';
import { PaymentService } from '../src/modules/payment/payment.service';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log(
    '=== 2J.17-A CANCELLED CONFIRMATION PROTECTION RUNTIME TEST ===',
  );

  const orderId =
    '7ce5e582-d557-4902-9047-99659fd222c9';

  const orderService =
    new OrderService(
      prisma as any,
      new PromoService(prisma as any),
      new PaymentService(prisma as any),
    );

  const before =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!before) {
    throw new Error(
      'Order tidak ditemukan.',
    );
  }

  console.log(
    'ORDER ID:',
    before.id,
  );

  console.log(
    'ORDER NUMBER:',
    before.orderNumber,
  );

  console.log(
    'ORDER STATUS BEFORE:',
    before.status,
  );

  if (before.status !== 'CANCELLED') {
    throw new Error(
      `Expected CANCELLED, got ${before.status}`,
    );
  }

  try {
    await orderService.confirmOrder(
      orderId,
    );

    throw new Error(
      'Order CANCELLED berhasil dikonfirmasi kembali menjadi CONFIRMED.',
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        'Order CANCELLED berhasil dikonfirmasi kembali menjadi CONFIRMED.'
    ) {
      throw error;
    }

    console.log(
      'CONFIRM ORDER REJECTED: PASS',
    );

    console.log(
      'ERROR:',
      error instanceof Error
        ? error.message
        : error,
    );
  }

  const after =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!after) {
    throw new Error(
      'Order tidak ditemukan setelah runtime test.',
    );
  }

  console.log(
    'ORDER STATUS AFTER:',
    after.status,
  );

  if (after.status !== 'CANCELLED') {
    throw new Error(
      `Order berubah! Expected CANCELLED, got ${after.status}`,
    );
  }

  console.log(
    'ORDER REMAINS CANCELLED: PASS',
  );

  console.log(
    '=== 2J.17-A RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.17-A RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });