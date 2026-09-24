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
    '=== 2J.21-B SHIPPED LIFECYCLE IDEMPOTENCY RUNTIME TEST ===',
  );

  const orderId =
    '677c5c20-8188-44cb-bcc9-2a820e63808d';

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

  const first =
    await orderService.shipOrder(
      orderId,
    );

  console.log(
    'FIRST SHIP RESULT:',
    first.status,
  );

  if (first.status !== 'SHIPPED') {
    throw new Error(
      `First ship expected SHIPPED, got ${first.status}`,
    );
  }

  console.log(
    'FIRST SHIP: PASS',
  );

  const afterFirst =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!afterFirst) {
    throw new Error(
      'Order tidak ditemukan setelah first ship.',
    );
  }

  console.log(
    'ORDER STATUS AFTER FIRST SHIP:',
    afterFirst.status,
  );

  if (afterFirst.status !== 'SHIPPED') {
    throw new Error(
      `Expected SHIPPED after first ship, got ${afterFirst.status}`,
    );
  }

  console.log(
    'FIRST SHIP PERSISTENCE: PASS',
  );

  const second =
    await orderService.shipOrder(
      orderId,
    );

  console.log(
    'SECOND SHIP RESULT:',
    second.status,
  );

  if (second.status !== 'SHIPPED') {
    throw new Error(
      `Second ship expected SHIPPED, got ${second.status}`,
    );
  }

  console.log(
    'SHIPPED → SHIPPED IDEMPOTENCY: PASS',
  );

  const afterSecond =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!afterSecond) {
    throw new Error(
      'Order tidak ditemukan setelah second ship.',
    );
  }

  console.log(
    'ORDER STATUS AFTER SECOND SHIP:',
    afterSecond.status,
  );

  if (afterSecond.status !== 'SHIPPED') {
    throw new Error(
      `Expected SHIPPED after second ship, got ${afterSecond.status}`,
    );
  }

  console.log(
    'SECOND SHIP PERSISTENCE: PASS',
  );

  console.log(
    '=== 2J.21-B RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.21-B RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });