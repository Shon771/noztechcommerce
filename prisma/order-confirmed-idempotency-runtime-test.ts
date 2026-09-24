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
    '=== 2J.12-B CONFIRMED IDEMPOTENCY RUNTIME TEST ===',
  );

  const orderId =
    '8b12560e-4430-486e-ab7b-01db9da686cb';

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

  if (before.status !== 'CONFIRMED') {
    throw new Error(
      `Expected CONFIRMED, got ${before.status}`,
    );
  }

  const first =
    await orderService.confirmOrder(
      orderId,
    );

  console.log(
    'FIRST CONFIRM RESULT:',
    first.status,
  );

  if (first.status !== 'CONFIRMED') {
    throw new Error(
      `First confirmation changed status to ${first.status}`,
    );
  }

  console.log(
    'FIRST CONFIRM: PASS',
  );

  const second =
    await orderService.confirmOrder(
      orderId,
    );

  console.log(
    'SECOND CONFIRM RESULT:',
    second.status,
  );

  if (second.status !== 'CONFIRMED') {
    throw new Error(
      `Second confirmation changed status to ${second.status}`,
    );
  }

  console.log(
    'SECOND CONFIRM: PASS',
  );

  const after =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!after) {
    throw new Error(
      'Order tidak ditemukan setelah confirmation.',
    );
  }

  console.log(
    'ORDER STATUS AFTER:',
    after.status,
  );

  if (after.status !== 'CONFIRMED') {
    throw new Error(
      `Order status tidak immutable. Expected CONFIRMED, got ${after.status}`,
    );
  }

  console.log(
    'CONFIRMED STATE PRESERVED: PASS',
  );

  console.log(
    '=== 2J.12-B RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.12-B RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });