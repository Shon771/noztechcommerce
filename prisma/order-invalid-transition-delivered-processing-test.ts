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
    '=== 2J.27-E INVALID ORDER TRANSITION DELIVERED → PROCESSING TEST ===',
  );

  const customer =
    await prisma.customer.create({
      data: {
        name:
          '2J27-E Invalid Transition Customer',
        telegramId:
          `2j27e-${Date.now()}`,
      },
    });

  const order =
    await prisma.order.create({
      data: {
        orderNumber:
          `NT-2J27-E-${Date.now()}`,
        status: 'DELIVERED',
        subtotal: 175000,
        shippingCost: 0,
        discount: 0,
        total: 175000,
        customerId: customer.id,
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
    'CUSTOMER ID:',
    order.customerId,
  );

  if (order.status !== 'DELIVERED') {
    throw new Error(
      'Order fixture harus DELIVERED.',
    );
  }

  if (order.customerId !== customer.id) {
    throw new Error(
      'Order harus terhubung ke customer yang benar.',
    );
  }

  if (
    Number(order.total) !== 175000
  ) {
    throw new Error(
      'Order total fixture tidak sesuai.',
    );
  }

  console.log(
    'DELIVERED TERMINAL STATE: PASS',
  );

  console.log(
    'CUSTOMER → ORDER RELATION: PASS',
  );

  console.log(
    'ORDER TOTAL FIXTURE: PASS',
  );

  console.log(
    'INVALID TRANSITION TARGET: PROCESSING',
  );

  console.log(
    '=== 2J.27-E SETUP PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.27-E SETUP ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });