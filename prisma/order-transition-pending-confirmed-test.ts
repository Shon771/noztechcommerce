import 'dotenv/config';

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import { OrderService } from '../src/modules/order/order.service';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log(
    '=== 2J.27-A ORDER TRANSITION PENDING → CONFIRMED TEST ===',
  );

  const customer =
    await prisma.customer.create({
      data: {
        name:
          '2J27-A Order Transition Customer',
        telegramId:
          `2j27a-${Date.now()}`,
      },
    });

  const order =
    await prisma.order.create({
      data: {
        orderNumber:
          `NT-2J27-A-${Date.now()}`,
        status: 'PENDING',
        subtotal: 100000,
        shippingCost: 0,
        discount: 0,
        total: 100000,
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

  if (order.status !== 'PENDING') {
    throw new Error(
      'Order fixture harus PENDING.',
    );
  }

  if (order.customerId !== customer.id) {
    throw new Error(
      'Order harus terhubung ke customer yang benar.',
    );
  }

  if (
    Number(order.total) !== 100000
  ) {
    throw new Error(
      'Order total fixture tidak sesuai.',
    );
  }

  console.log(
    'PENDING ORDER STATE: PASS',
  );

  console.log(
    'CUSTOMER → ORDER RELATION: PASS',
  );

  console.log(
    'ORDER TOTAL FIXTURE: PASS',
  );

  console.log(
    '=== 2J.27-A SETUP PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.27-A SETUP ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });