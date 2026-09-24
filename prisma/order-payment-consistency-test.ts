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
    '=== ORDER PAYMENT CONSISTENCY TEST ===',
  );

  const customer =
    await prisma.customer.create({
      data: {
        name: '2J10 Order Payment Test',
        telegramId: `TEST-2J10-${Date.now()}`,
      },
    });

  const order =
    await prisma.order.create({
      data: {
        orderNumber: `NT-2J10-${Date.now()}`,
        status: 'PENDING',
        subtotal: 10000,
        shippingCost: 0,
        discount: 0,
        total: 10000,
        customerId: customer.id,
      },
    });

  const payment =
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: 10000,
        method: 'COD',
        status: 'PENDING',
      },
    });

  console.log(
    'ORDER ID:',
    order.id,
  );

  console.log(
    'ORDER NUMBER:',
    order.orderNumber,
  );

  console.log(
    'ORDER STATUS:',
    order.status,
  );

  console.log(
    'PAYMENT ID:',
    payment.id,
  );

  console.log(
    'PAYMENT STATUS:',
    payment.status,
  );

  if (order.status !== 'PENDING') {
    throw new Error(
      `Expected order PENDING, got ${order.status}`,
    );
  }

  if (payment.status !== 'PENDING') {
    throw new Error(
      `Expected payment PENDING, got ${payment.status}`,
    );
  }

  console.log(
    'INITIAL CONSISTENCY CHECK: PASS',
  );

  console.log(
    '=== ORDER PAYMENT CONSISTENCY SETUP PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== ORDER PAYMENT CONSISTENCY SETUP ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });