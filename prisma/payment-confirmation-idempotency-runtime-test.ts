import 'dotenv/config';

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import { PaymentService } from '../src/modules/payment/payment.service';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log(
    '=== 2J.25-B PAYMENT CONFIRMATION IDEMPOTENCY RUNTIME TEST ===',
  );

  const orderId =
    '17583f3e-8301-46e7-b688-c4ccde55e6e8';

  const paymentId =
    'd79d247c-2645-496f-b64c-52ae263348a3';

  const paymentService =
    new PaymentService(
      prisma as any,
    );

  const before =
    await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
    });

  if (!before) {
    throw new Error(
      'Payment fixture tidak ditemukan.',
    );
  }

  if (before.orderId !== orderId) {
    throw new Error(
      'Payment tidak terhubung ke Order fixture.',
    );
  }

  if (before.status !== 'PAID') {
    throw new Error(
      `Payment harus PAID sebelum test, status=${before.status}.`,
    );
  }

  console.log(
    'PAYMENT STATUS BEFORE:',
    before.status,
  );

  console.log(
    'TRANSACTION ID BEFORE:',
    before.transactionId,
  );

  console.log(
    'PAID AT BEFORE:',
    before.paidAt,
  );

  let rejected = false;

  try {
    await paymentService.confirmPayment(
      paymentId,
      `TX-2J25-B-SECOND-${Date.now()}`,
    );
  } catch (error) {
    rejected = true;

    console.log(
      'SECOND CONFIRM REJECTED: PASS',
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

  if (!rejected) {
    throw new Error(
      'Second confirmation seharusnya ditolak.',
    );
  }

  const after =
    await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
    });

  if (!after) {
    throw new Error(
      'Payment hilang setelah second confirmation.',
    );
  }

  console.log(
    'PAYMENT STATUS AFTER:',
    after.status,
  );

  console.log(
    'TRANSACTION ID AFTER:',
    after.transactionId,
  );

  console.log(
    'PAID AT AFTER:',
    after.paidAt,
  );

  if (after.status !== 'PAID') {
    throw new Error(
      'Payment status berubah setelah second confirmation.',
    );
  }

  if (
    after.transactionId !==
    before.transactionId
  ) {
    throw new Error(
      'Transaction ID berubah setelah second confirmation.',
    );
  }

  if (
    after.paidAt?.getTime() !==
    before.paidAt?.getTime()
  ) {
    throw new Error(
      'paidAt berubah setelah second confirmation.',
    );
  }

  if (after.orderId !== orderId) {
    throw new Error(
      'Payment orderId berubah setelah second confirmation.',
    );
  }

  console.log(
    'PAID STATE PRESERVED: PASS',
  );

  console.log(
    'TRANSACTION ID PRESERVED: PASS',
  );

  console.log(
    'PAID TIMESTAMP PRESERVED: PASS',
  );

  console.log(
    'PAYMENT → ORDER RELATION PRESERVED: PASS',
  );

  console.log(
    'CANCELLED/FAILED/OTHER STATE TRANSITION: NOT TRIGGERED',
  );

  console.log(
    '=== 2J.25-B RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.25-B RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });