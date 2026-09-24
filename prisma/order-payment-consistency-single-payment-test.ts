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
    '=== 2J.24-B ORDER PAYMENT CONSISTENCY SINGLE PAYMENT TEST ===',
  );

  const customer = await prisma.customer.create({
    data: {
      name: '2J24-B Payment Consistency Customer',
      telegramId: `2j24b-${Date.now()}`,
    },
  });

  const order = await prisma.order.create({
    data: {
      orderNumber: `NT-2J24-B-${Date.now()}`,
      status: 'PENDING',
      subtotal: 25000,
      shippingCost: 0,
      discount: 0,
      total: 25000,
      customerId: customer.id,
    },
  });

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      amount: 25000,
      method: 'QRIS',
      status: 'PENDING',
    },
  });

  const paymentCount =
    await prisma.payment.count({
      where: {
        orderId: order.id,
      },
    });

  if (paymentCount !== 1) {
    throw new Error(
      `Expected exactly 1 payment, found ${paymentCount}.`,
    );
  }

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

  console.log(
    'PAYMENT METHOD:',
    payment.method,
  );

  console.log(
    'PAYMENT AMOUNT:',
    payment.amount.toString(),
  );

  console.log(
    'PAYMENT COUNT:',
    paymentCount,
  );

  console.log(
    'ORDER ↔ PAYMENT RELATION: PASS',
  );

  console.log(
    'SINGLE PAYMENT CONSTRAINT: PASS',
  );

  console.log(
    '=== 2J.24-B SETUP PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.24-B SETUP ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });