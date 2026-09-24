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
    '=== PAYMENT TRANSACTION OVERWRITE READ TEST ===',
  );

  const payment =
    await prisma.payment.findUnique({
      where: {
        id: '8d08504e-ec75-464a-b234-683ba28d5aa2',
      },
    });

  if (!payment) {
    throw new Error(
      'Payment tidak ditemukan.',
    );
  }

  console.log(
    'PAYMENT ID:',
    payment.id,
  );

  console.log(
    'PAYMENT STATUS:',
    payment.status,
  );

  console.log(
    'TRANSACTION ID:',
    payment.transactionId,
  );

  const expectedTransactionId =
    'TEST-2J9-ORIGINAL-1787130006887';

  if (
    payment.transactionId !==
    expectedTransactionId
  ) {
    throw new Error(
      `TransactionId berubah! Expected ${expectedTransactionId}, got ${payment.transactionId}`,
    );
  }

  if (payment.status !== 'PAID') {
    throw new Error(
      `Payment status berubah! Expected PAID, got ${payment.status}`,
    );
  }

  console.log(
    'TRANSACTION ID IMMUTABILITY: PASS',
  );

  console.log(
    '=== PAYMENT TRANSACTION OVERWRITE READ TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== PAYMENT TRANSACTION OVERWRITE READ TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });