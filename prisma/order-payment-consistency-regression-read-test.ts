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
    '=== 2J.10-B REGRESSION READ-BACK ===',
  );

  const payment =
    await prisma.payment.findUnique({
      where: {
        id: '4cea3aed-e84f-4ab5-9b3b-c06d78c8eee2',
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
    'PAID AT:',
    payment.paidAt,
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
      `Expected PAID, got ${payment.status}`,
    );
  }

  if (
    payment.transactionId !==
    'TEST-2J10-B-REGRESSION-001'
  ) {
    throw new Error(
      `TransactionId tidak sesuai. Got ${payment.transactionId}`,
    );
  }

  if (!payment.paidAt) {
    throw new Error(
      'paidAt tidak tersimpan.',
    );
  }

  if (payment.order.status !== 'CONFIRMED') {
    throw new Error(
      `Expected order CONFIRMED, got ${payment.order.status}`,
    );
  }

  console.log(
    'PAYMENT PAID: PASS',
  );

  console.log(
    'TRANSACTION ID: PASS',
  );

  console.log(
    'PAID AT: PASS',
  );

  console.log(
    'ORDER CONFIRMED: PASS',
  );

  console.log(
    '=== 2J.10-B REGRESSION READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.10-B REGRESSION READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });