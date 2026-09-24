import 'dotenv/config';

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import { OrderService } from '../src/modules/order/order.service';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log(
    '=== 2J.27-E INVALID ORDER TRANSITION DELIVERED → PROCESSING RUNTIME TEST ===',
  );

  const orderId =
    '88ea94cd-d622-4c7e-a6ba-03b756fef7b5';

  const orderService =
    new OrderService(
      prisma as any,
      null as any,
      null as any,
    );

  const beforeOrder =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!beforeOrder) {
    throw new Error(
      'Order fixture tidak ditemukan.',
    );
  }

  console.log(
    'ORDER STATUS BEFORE:',
    beforeOrder.status,
  );

  if (beforeOrder.status !== 'DELIVERED') {
    throw new Error(
      `Order harus DELIVERED sebelum invalid transition test, tetapi ${beforeOrder.status}.`,
    );
  }

  let rejected = false;

  try {
    const result =
      await orderService.processOrder(
        orderId,
      );

    console.log(
      'PROCESS ORDER ACCEPTED: OBSERVED',
    );

    console.log(
      'PROCESS ORDER RESULT:',
      result.status,
    );
  } catch (error) {
    rejected = true;

    console.log(
      'PROCESS ORDER REJECTED: PASS',
    );

    console.log(
      'ERROR TYPE:',
      error?.constructor?.name,
    );

    console.log(
      'ERROR:',
      error instanceof Error
        ? error.message
        : String(error),
    );
  }

  const afterOrder =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!afterOrder) {
    throw new Error(
      'Order hilang setelah invalid transition attempt.',
    );
  }

  console.log(
    'ORDER STATUS AFTER:',
    afterOrder.status,
  );

  console.log(
    'ORDER ID AFTER:',
    afterOrder.id,
  );

  if (!rejected) {
    throw new Error(
      'Invalid transition DELIVERED → PROCESSING seharusnya ditolak.',
    );
  }

  if (afterOrder.status !== 'DELIVERED') {
    throw new Error(
      `Order berubah dari DELIVERED menjadi ${afterOrder.status}.`,
    );
  }

  if (afterOrder.id !== orderId) {
    throw new Error(
      'Order ID berubah setelah invalid transition attempt.',
    );
  }

  console.log(
    'DELIVERED TERMINAL STATE PRESERVED: PASS',
  );

  console.log(
    'INVALID TRANSITION BLOCKED: PASS',
  );

  console.log(
    'ORDER ID PRESERVED: PASS',
  );

  console.log(
    'DELIVERED NOT PROMOTED/DEMOTED: PASS',
  );

  console.log(
    '=== 2J.27-E RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.27-E RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });