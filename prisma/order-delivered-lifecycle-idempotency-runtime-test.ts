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
    '=== 2J.21-A DELIVERED LIFECYCLE IDEMPOTENCY RUNTIME TEST ===',
  );

  const orderId =
    'b2c1643f-2148-44d7-aaf5-5fd9605edb1d';

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

  if (before.status !== 'DELIVERED') {
    throw new Error(
      `Expected DELIVERED, got ${before.status}`,
    );
  }

  const first =
    await orderService.deliverOrder(
      orderId,
    );

  console.log(
    'FIRST DELIVER RESULT:',
    first.status,
  );

  if (first.status !== 'DELIVERED') {
    throw new Error(
      `First deliver expected DELIVERED, got ${first.status}`,
    );
  }

  console.log(
    'FIRST DELIVER: PASS',
  );

  const afterFirst =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!afterFirst) {
    throw new Error(
      'Order tidak ditemukan setelah first deliver.',
    );
  }

  console.log(
    'ORDER STATUS AFTER FIRST DELIVER:',
    afterFirst.status,
  );

  if (afterFirst.status !== 'DELIVERED') {
    throw new Error(
      `Expected DELIVERED after first deliver, got ${afterFirst.status}`,
    );
  }

  console.log(
    'FIRST DELIVER PERSISTENCE: PASS',
  );

  const second =
    await orderService.deliverOrder(
      orderId,
    );

  console.log(
    'SECOND DELIVER RESULT:',
    second.status,
  );

  if (second.status !== 'DELIVERED') {
    throw new Error(
      `Second deliver expected DELIVERED, got ${second.status}`,
    );
  }

  console.log(
    'DELIVERED → DELIVERED IDEMPOTENCY: PASS',
  );

  const afterSecond =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!afterSecond) {
    throw new Error(
      'Order tidak ditemukan setelah second deliver.',
    );
  }

  console.log(
    'ORDER STATUS AFTER SECOND DELIVER:',
    afterSecond.status,
  );

  if (afterSecond.status !== 'DELIVERED') {
    throw new Error(
      `Expected DELIVERED after second deliver, got ${afterSecond.status}`,
    );
  }

  console.log(
    'SECOND DELIVER PERSISTENCE: PASS',
  );

  console.log(
    '=== 2J.21-A RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.21-A RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });