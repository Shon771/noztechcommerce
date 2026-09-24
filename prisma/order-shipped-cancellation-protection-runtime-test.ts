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
    '=== 2J.20-A SHIPPED CANCELLATION PROTECTION RUNTIME TEST ===',
  );

  // GANTI DENGAN ORDER ID DARI SETUP 2J.20-A
 const orderId =
  '944e4f58-fbb6-4d35-a11f-5228eef7128a';

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

  if (before.status !== 'SHIPPED') {
    throw new Error(
      `Expected SHIPPED, got ${before.status}`,
    );
  }

  try {
    await orderService.cancelOrder(
      orderId,
    );

    throw new Error(
      'Order SHIPPED berhasil dibatalkan.',
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        'Order SHIPPED berhasil dibatalkan.'
    ) {
      throw error;
    }

    console.log(
      'CANCEL ORDER REJECTED: PASS',
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

  if (after.status !== 'SHIPPED') {
    throw new Error(
      `Order berubah! Expected SHIPPED, got ${after.status}`,
    );
  }

  console.log(
    'ORDER REMAINS SHIPPED: PASS',
  );

  console.log(
    '=== 2J.20-A RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.20-A RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });