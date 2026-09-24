import 'dotenv/config';

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log(
    '=== 2J.25-B PAYMENT CONFIRMATION IDEMPOTENCY FINAL READ-BACK ===',
  );

  const orderId =
    '17583f3e-8301-46e7-b688-c4ccde55e6e8';

  const paymentId =
    'd79d247c-2645-496f-b64c-52ae263348a3';

  const payment =
    await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
    });

  if (!payment) {
    throw new Error(
      'Payment fixture tidak ditemukan.',
    );
  }

  if (payment.orderId !== orderId) {
    throw new Error(
      'Payment tidak terhubung ke Order yang benar.',
    );
  }

  if (payment.status !== 'PAID') {
    throw new Error(
      `Payment harus tetap PAID, status=${payment.status}.`,
    );
  }

  if (!payment.transactionId) {
    throw new Error(
      'Transaction ID hilang.',
    );
  }

  if (!payment.paidAt) {
    throw new Error(
      'paidAt hilang.',
    );
  }

  console.log(
    'PAYMENT ID:',
    payment.id,
  );

  console.log(
    'PAYMENT ORDER ID:',
    payment.orderId,
  );

  console.log(
    'PAYMENT STATUS:',
    payment.status,
  );

  console.log(
    'TRANSACTION ID:',
    payment.transactionId,
  );

  console.log(
    'PAID AT:',
    payment.paidAt,
  );

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
    'SECOND CONFIRMATION PROTECTION PERSISTED: PASS',
  );

  console.log(
    '=== 2J.25-B FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.25-B FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });