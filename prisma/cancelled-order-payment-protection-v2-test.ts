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
    '=== 2J.26-A V2 CANCELLED ORDER PAYMENT PROTECTION TEST ===',
  );

  const customer =
    await prisma.customer.create({
      data: {
        name:
          '2J26-A V2 Cancelled Customer',
        telegramId:
          `2j26a-v2-${Date.now()}`,
      },
    });

  const order =
    await prisma.order.create({
      data: {
        orderNumber:
          `NT-2J26-A-V2-${Date.now()}`,
        status: 'CANCELLED',
        subtotal: 45000,
        shippingCost: 0,
        discount: 0,
        total: 45000,
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

  if (order.status !== 'CANCELLED') {
    throw new Error(
      'Order harus CANCELLED.',
    );
  }

  if (payment.status !== 'PENDING') {
    throw new Error(
      'Payment harus PENDING.',
    );
  }

  if (payment.orderId !== order.id) {
    throw new Error(
      'Payment relation tidak sesuai.',
    );
  }

  console.log(
    'CANCELLED ORDER STATE: PASS',
  );

  console.log(
    'PENDING PAYMENT STATE: PASS',
  );

  console.log(
    'PAYMENT → ORDER RELATION: PASS',
  );

  console.log(
    '=== 2J.26-A V2 SETUP PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.26-A V2 SETUP ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });