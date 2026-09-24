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
    '=== 2J.21-C CANCELLED LIFECYCLE IDEMPOTENCY RUNTIME TEST ===',
  );

  const orderId =
    '7dcbdfe6-b108-4449-abde-84061a0b18b9';

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

  const first =
    await orderService.cancelOrder(
      orderId,
    );

  console.log(
    'FIRST CANCEL RESULT:',
    first.status,
  );

  if (first.status !== 'CANCELLED') {
    throw new Error(
      `First cancel expected CANCELLED, got ${first.status}`,
    );
  }

  console.log(
    'FIRST CANCEL: PASS',
  );

  const afterFirst =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!afterFirst) {
    throw new Error(
      'Order tidak ditemukan setelah first cancel.',
    );
  }

  console.log(
    'ORDER STATUS AFTER FIRST CANCEL:',
    afterFirst.status,
  );

  if (afterFirst.status !== 'CANCELLED') {
    throw new Error(
      `Expected CANCELLED after first cancel, got ${afterFirst.status}`,
    );
  }

  console.log(
    'FIRST CANCEL PERSISTENCE: PASS',
  );

  const second =
    await orderService.cancelOrder(
      orderId,
    );

  console.log(
    'SECOND CANCEL RESULT:',
    second.status,
  );

  if (second.status !== 'CANCELLED') {
    throw new Error(
      `Second cancel expected CANCELLED, got ${second.status}`,
    );
  }

  console.log(
    'CANCELLED → CANCELLED IDEMPOTENCY: PASS',
  );

  const afterSecond =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!afterSecond) {
    throw new Error(
      'Order tidak ditemukan setelah second cancel.',
    );
  }

  console.log(
    'ORDER STATUS AFTER SECOND CANCEL:',
    afterSecond.status,
  );

  if (afterSecond.status !== 'CANCELLED') {
    throw new Error(
      `Expected CANCELLED after second cancel, got ${afterSecond.status}`,
    );
  }

  console.log(
    'SECOND CANCEL PERSISTENCE: PASS',
  );

  console.log(
    '=== 2J.21-C RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.21-C RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });