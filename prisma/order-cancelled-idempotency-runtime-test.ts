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
    '=== 2J.18-B CANCELLED IDEMPOTENCY RUNTIME TEST ===',
  );

  const orderId =
    '9d22cec0-8863-41d4-9d12-0cb927822db9';

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
    'SECOND CANCEL: PASS',
  );

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
    'CANCELLED STATE PRESERVED: PASS',
  );

  console.log(
    '=== 2J.18-B RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.18-B RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });