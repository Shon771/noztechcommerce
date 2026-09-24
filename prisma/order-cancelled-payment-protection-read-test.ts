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
    '=== ORDER CANCELLED PAYMENT PROTECTION READ TEST ===',
  );

  const payment =
    await prisma.payment.findUnique({
      where: {
        id: '985980b8-1f48-4217-9a4c-0183738d70e9',
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

  console.log(
    '=== END READ TEST ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== ORDER CANCELLED PAYMENT PROTECTION READ ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });