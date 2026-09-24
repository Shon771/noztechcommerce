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
  console.log('=== PAYMENT FAILED PROTECTION TEST ===');

  const customer =
    await prisma.customer.findFirst({
      where: {
        telegramId: 'TEST-2J8A-FAILED',
      },
    });

  const testCustomer =
    customer ??
    await prisma.customer.create({
      data: {
        name: '2J8A Failed Payment Test',
        telegramId: 'TEST-2J8A-FAILED',
      },
    });

  const order =
    await prisma.order.create({
      data: {
        orderNumber: `NT-2J8A-${Date.now()}`,
        status: 'PENDING',
        subtotal: 10000,
        shippingCost: 0,
        discount: 0,
        total: 10000,
        customerId: testCustomer.id,
      },
    });

  const payment =
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: 10000,
        method: 'COD',
        status: 'FAILED',
      },
    });

  console.log('ORDER ID:', order.id);
  console.log('ORDER NUMBER:', order.orderNumber);
  console.log('PAYMENT ID:', payment.id);
  console.log('PAYMENT STATUS:', payment.status);

  if (payment.status !== 'FAILED') {
    throw new Error(
      `Expected FAILED, got ${payment.status}`,
    );
  }

  console.log(
    '=== PAYMENT FAILED PROTECTION SETUP PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== PAYMENT FAILED PROTECTION SETUP ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });