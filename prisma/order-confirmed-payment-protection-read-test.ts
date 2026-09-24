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
    '=== 2J.10-C CONFIRMED ORDER READ-BACK TEST ===',
  );

  const payment =
    await prisma.payment.findUnique({
      where: {
        id: '7012053d-1488-460b-899c-3a5a49225e21',
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
    'TEST-2J10-C-ORIGINAL-1787134941045'
  ) {
    throw new Error(
      `TransactionId berubah! Got ${payment.transactionId}`,
    );
  }

  if (!payment.paidAt) {
    throw new Error(
      'paidAt tidak tersedia.',
    );
  }

  if (payment.order.status !== 'CONFIRMED') {
    throw new Error(
      `Expected CONFIRMED, got ${payment.order.status}`,
    );
  }

  console.log(
    'PAYMENT REMAINS PAID: PASS',
  );

  console.log(
    'ORIGINAL TRANSACTION ID PRESERVED: PASS',
  );

  console.log(
    'PAID AT PRESERVED: PASS',
  );

  console.log(
    'ORDER REMAINS CONFIRMED: PASS',
  );

  console.log(
    '=== 2J.10-C READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.10-C READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });