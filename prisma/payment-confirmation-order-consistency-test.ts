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
    '=== 2J.25-A PAYMENT CONFIRMATION ORDER CONSISTENCY TEST ===',
  );

  const customer =
    await prisma.customer.create({
      data: {
        name:
          '2J25-A Payment Confirmation Customer',
        telegramId:
          `2j25a-${Date.now()}`,
      },
    });

  const order =
    await prisma.order.create({
      data: {
        orderNumber:
          `NT-2J25-A-${Date.now()}`,
        status: 'PENDING',
        subtotal: 50000,
        shippingCost: 0,
        discount: 0,
        total: 50000,
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
      'Initial Order state harus PENDING.',
    );
  }

  if (payment.status !== 'PENDING') {
    throw new Error(
      'Initial Payment state harus PENDING.',
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
    'INITIAL ORDER STATE: PASS',
  );

  console.log(
    'INITIAL PAYMENT STATE: PASS',
  );

  console.log(
    'ORDER ↔ PAYMENT AMOUNT: PASS',
  );

  console.log(
    '=== 2J.25-A SETUP PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.25-A SETUP ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });