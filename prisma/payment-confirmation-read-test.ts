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
  console.log('=== PAYMENT CONFIRMATION READ TEST ===');

  const payment = await prisma.payment.findUnique({
    where: {
      id: '1b505520-4314-43e7-835e-caec4f353e1e',
    },
    include: {
      order: true,
    },
  });

  if (!payment) {
    throw new Error('Payment tidak ditemukan.');
  }

  console.log('PAYMENT STATUS:', payment.status);
  console.log('PAYMENT METHOD:', payment.method);
  console.log('TRANSACTION ID:', payment.transactionId);

  console.log('ORDER NUMBER:', payment.order.orderNumber);
  console.log('ORDER STATUS:', payment.order.status);

  if (payment.status !== 'PAID') {
    throw new Error(
      `Payment status tidak sesuai. Expected PAID, got ${payment.status}`,
    );
  }

  if (payment.order.status !== 'CONFIRMED') {
    throw new Error(
      `Order status tidak sesuai. Expected CONFIRMED, got ${payment.order.status}`,
    );
  }

  console.log(
    '=== PAYMENT CONFIRMATION READ TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== PAYMENT CONFIRMATION READ TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });