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
    '=== 2J.31-I6 PAYMENT TRANSACTION OVERWRITE BOUNDARY RUNTIME TEST ===',
  );

  const paymentId =
    '8d08504e-ec75-464a-b234-683ba28d5aa2';

  const originalTransactionId =
    'TEST-2J9-ORIGINAL-1787130006887';

  const attemptedTransactionId =
    `I6-OVERWRITE-${Date.now()}`;

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

  if (before.status !== 'PAID') {
    throw new Error(
      `Payment harus PAID sebelum test, status=${before.status}.`,
    );
  }

  if (
    before.transactionId !==
    originalTransactionId
  ) {
    throw new Error(
      `Transaction ID awal tidak sesuai. Expected ${originalTransactionId}, got ${before.transactionId}`,
    );
  }

  console.log(
    'PAYMENT ID:',
    before.id,
  );

  console.log(
    'PAYMENT STATUS BEFORE:',
    before.status,
  );

  console.log(
    'ORIGINAL TRANSACTION ID:',
    before.transactionId,
  );

  console.log(
    'ATTEMPTED NEW TRANSACTION ID:',
    attemptedTransactionId,
  );

  let rejected = false;

  try {
    const response =
      await fetch(
        'http://localhost:3000/payment/confirm',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            paymentId,
            transactionId:
              attemptedTransactionId,
          }),
        },
      );

    const body =
      await response.text();

    if (!response.ok) {
      rejected = true;

      console.log(
        'CONFIRM OVERWRITE REJECTED: PASS',
      );

      console.log(
        'HTTP STATUS:',
        response.status,
      );

      console.log(
        'RESPONSE:',
        body,
      );
    } else {
      throw new Error(
        `Overwrite attempt unexpectedly succeeded. HTTP ${response.status}.`,
      );
    }
  } catch (error) {
    if (rejected) {
      // Expected HTTP rejection.
    } else {
      throw error;
    }
  }

  if (!rejected) {
    throw new Error(
      'Transaction overwrite seharusnya ditolak.',
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
      'Payment hilang setelah overwrite attempt.',
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
      'Payment status berubah setelah overwrite attempt.',
    );
  }

  if (
    after.transactionId !==
    originalTransactionId
  ) {
    throw new Error(
      `Transaction ID berhasil di-overwrite. Expected ${originalTransactionId}, got ${after.transactionId}`,
    );
  }

  if (
    after.paidAt?.getTime() !==
    before.paidAt?.getTime()
  ) {
    throw new Error(
      'paidAt berubah setelah overwrite attempt.',
    );
  }

  console.log(
    'PAID STATE PRESERVED: PASS',
  );

  console.log(
    'TRANSACTION ID IMMUTABILITY: PASS',
  );

  console.log(
    'PAID TIMESTAMP PRESERVED: PASS',
  );

  console.log(
    'OVERWRITE BOUNDARY PROTECTION: PASS',
  );

  console.log(
    '=== 2J.31-I6 RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.31-I6 RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });