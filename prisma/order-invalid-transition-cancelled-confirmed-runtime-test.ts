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
    '=== 2J.27-H INVALID ORDER TRANSITION CANCELLED → CONFIRMED RUNTIME TEST ===',
  );

  const orderId =
    '407dced8-7a33-472c-892d-483ec530d726';

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

  if (beforeOrder.status !== 'CANCELLED') {
    throw new Error(
      `Order harus CANCELLED sebelum invalid transition test, tetapi ${beforeOrder.status}.`,
    );
  }

  let rejected = false;

  try {
    const result =
      await orderService.confirmOrder(
        orderId,
      );

    console.log(
      'CONFIRM ORDER ACCEPTED: OBSERVED',
    );

    console.log(
      'CONFIRM ORDER RESULT:',
      result.status,
    );
  } catch (error) {
    rejected = true;

    console.log(
      'CONFIRM ORDER REJECTED: PASS',
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
      'Invalid transition CANCELLED → CONFIRMED seharusnya ditolak.',
    );
  }

  if (afterOrder.status !== 'CANCELLED') {
    throw new Error(
      `Order berubah dari CANCELLED menjadi ${afterOrder.status}.`,
    );
  }

  if (afterOrder.id !== orderId) {
    throw new Error(
      'Order ID berubah setelah invalid transition attempt.',
    );
  }

  console.log(
    'CANCELLED TERMINAL STATE PRESERVED: PASS',
  );

  console.log(
    'INVALID TRANSITION BLOCKED: PASS',
  );

  console.log(
    'ORDER ID PRESERVED: PASS',
  );

  console.log(
    'CANCELLED NOT PROMOTED: PASS',
  );

  console.log(
    '=== 2J.27-H RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.27-H RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });