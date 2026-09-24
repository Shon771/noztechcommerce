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
    '=== 2J.10-B FIX TEST #1 READ-BACK ===',
  );

  const payment =
    await prisma.payment.findUnique({
      where: {
        id: '5098c4e2-985e-4b66-914d-f43a4c158187',
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

  if (payment.status !== 'PENDING') {
    throw new Error(
      `Payment berubah! Expected PENDING, got ${payment.status}`,
    );
  }

  if (payment.transactionId !== null) {
    throw new Error(
      `TransactionId berubah! Expected null, got ${payment.transactionId}`,
    );
  }

  if (payment.order.status !== 'CANCELLED') {
    throw new Error(
      `Order berubah! Expected CANCELLED, got ${payment.order.status}`,
    );
  }

  console.log(
    'PAYMENT REMAINS PENDING: PASS',
  );

  console.log(
    'TRANSACTION ID REMAINS NULL: PASS',
  );

  console.log(
    'ORDER REMAINS CANCELLED: PASS',
  );

  console.log(
    '=== 2J.10-B FIX TEST #1 READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.10-B FIX TEST #1 READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });