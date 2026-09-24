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
    '=== 2J.15-C DELIVERED IDEMPOTENCY RUNTIME TEST ===',
  );

  const orderId =
    '9cc63df6-3a45-4142-8bc7-349cd4e870e7';

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
      `First deliver changed status to ${first.status}`,
    );
  }

  console.log(
    'FIRST DELIVER: PASS',
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
      `Second deliver changed status to ${second.status}`,
    );
  }

  console.log(
    'SECOND DELIVER: PASS',
  );

  const after =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!after) {
    throw new Error(
      'Order tidak ditemukan setelah delivery.',
    );
  }

  console.log(
    'ORDER STATUS AFTER:',
    after.status,
  );

  if (after.status !== 'DELIVERED') {
    throw new Error(
      `Delivered state tidak preserved. Expected DELIVERED, got ${after.status}`,
    );
  }

  console.log(
    'DELIVERED STATE PRESERVED: PASS',
  );

  console.log(
    '=== 2J.15-C RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.15-C RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });