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
    '=== ORDER PAYMENT CONSISTENCY READ TEST ===',
  );

  const payment =
    await prisma.payment.findUnique({
      where: {
        id: '3881cc19-8d1a-4d08-8ffa-33610b491af5',
      },
      include: {
        order: true,
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

  console.log(
    'ORDER ID:',
    payment.order.id,
  );

  console.log(
    'ORDER NUMBER:',
    payment.order.orderNumber,
  );

  console.log(
    'ORDER STATUS:',
    payment.order.status,
  );

  if (payment.status !== 'PAID') {
    throw new Error(
      `Expected payment PAID, got ${payment.status}`,
    );
  }

  if (
    payment.transactionId !==
    'TEST-2J10-CONSISTENCY-001'
  ) {
    throw new Error(
      `transactionId tidak sesuai. Got ${payment.transactionId}`,
    );
  }

  if (payment.order.status !== 'CONFIRMED') {
    throw new Error(
      `Expected order CONFIRMED, got ${payment.order.status}`,
    );
  }

  console.log(
    'PAYMENT STATUS CONSISTENCY: PASS',
  );

  console.log(
    'ORDER STATUS CONSISTENCY: PASS',
  );

  console.log(
    'TRANSACTION ID CONSISTENCY: PASS',
  );

  console.log(
    '=== ORDER PAYMENT CONSISTENCY READ TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== ORDER PAYMENT CONSISTENCY READ TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });