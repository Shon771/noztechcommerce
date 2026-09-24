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
    '=== 2J.13-C PROCESSING IDEMPOTENCY RUNTIME TEST ===',
  );

  const orderId =
    'ce71c720-969d-47bd-977f-b01d4b8a4792';

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

  if (before.status !== 'PROCESSING') {
    throw new Error(
      `Expected PROCESSING, got ${before.status}`,
    );
  }

  const first =
    await orderService.processOrder(
      orderId,
    );

  console.log(
    'FIRST PROCESS RESULT:',
    first.status,
  );

  if (first.status !== 'PROCESSING') {
    throw new Error(
      `First process changed status to ${first.status}`,
    );
  }

  console.log(
    'FIRST PROCESS: PASS',
  );

  const second =
    await orderService.processOrder(
      orderId,
    );

  console.log(
    'SECOND PROCESS RESULT:',
    second.status,
  );

  if (second.status !== 'PROCESSING') {
    throw new Error(
      `Second process changed status to ${second.status}`,
    );
  }

  console.log(
    'SECOND PROCESS: PASS',
  );

  const after =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!after) {
    throw new Error(
      'Order tidak ditemukan setelah processing.',
    );
  }

  console.log(
    'ORDER STATUS AFTER:',
    after.status,
  );

  if (after.status !== 'PROCESSING') {
    throw new Error(
      `Processing state tidak immutable. Expected PROCESSING, got ${after.status}`,
    );
  }

  console.log(
    'PROCESSING STATE PRESERVED: PASS',
  );

  console.log(
    '=== 2J.13-C RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.13-C RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });