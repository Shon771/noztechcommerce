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
    '=== 2J.26-E PENDING ORDER PAYMENT CONSISTENCY TEST ===',
  );

  const customer =
    await prisma.customer.create({
      data: {
        name:
          '2J26-E Pending Order Customer',
        telegramId:
          `2j26e-${Date.now()}`,
      },
    });

  const order =
    await prisma.order.create({
      data: {
        orderNumber:
          `NT-2J26-E-${Date.now()}`,
        status: 'PENDING',
        subtotal: 85000,
        shippingCost: 0,
        discount: 0,
        total: 85000,
        customerId: customer.id,
      },
    });

  const payment =
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.total,
        method: 'QRIS',
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

  console.log(
    'PAYMENT AMOUNT:',
    Number(payment.amount),
  );

  if (order.status !== 'PENDING') {
    throw new Error(
      'Order fixture harus PENDING.',
    );
  }

  if (payment.status !== 'PENDING') {
    throw new Error(
      'Payment fixture harus PENDING.',
    );
  }

  if (payment.orderId !== order.id) {
    throw new Error(
      'Payment harus terhubung ke Order yang benar.',
    );
  }

  if (
    Number(payment.amount) !==
    Number(order.total)
  ) {
    throw new Error(
      'Payment amount harus sama dengan Order total.',
    );
  }

  console.log(
    'PENDING ORDER STATE: PASS',
  );

  console.log(
    'PENDING PAYMENT STATE: PASS',
  );

  console.log(
    'PAYMENT → ORDER RELATION: PASS',
  );

  console.log(
    'ORDER TOTAL ↔ PAYMENT AMOUNT: PASS',
  );

  console.log(
    '=== 2J.26-E SETUP PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.26-E SETUP ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });