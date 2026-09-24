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
    '=== 2J.25-B PAYMENT CONFIRMATION IDEMPOTENCY TEST ===',
  );

  const customer =
    await prisma.customer.create({
      data: {
        name:
          '2J25-B Payment Idempotency Customer',
        telegramId:
          `2j25b-${Date.now()}`,
      },
    });

  const order =
    await prisma.order.create({
      data: {
        orderNumber:
          `NT-2J25-B-${Date.now()}`,
        status: 'PENDING',
        subtotal: 75000,
        shippingCost: 0,
        discount: 0,
        total: 75000,
        customerId: customer.id,
      },
    });

  const payment =
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.total,
        method: 'QRIS',
        status: 'PAID',
        transactionId:
          `TX-2J25-B-${Date.now()}`,
        paidAt: new Date(),
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
    'TRANSACTION ID:',
    payment.transactionId,
  );

  console.log(
    'PAID AT:',
    payment.paidAt,
  );

  if (payment.status !== 'PAID') {
    throw new Error(
      'Initial Payment state harus PAID.',
    );
  }

  if (payment.orderId !== order.id) {
    throw new Error(
      'Payment harus terhubung ke Order yang benar.',
    );
  }

  console.log(
    'INITIAL PAID STATE: PASS',
  );

  console.log(
    'PAYMENT → ORDER RELATION: PASS',
  );

  console.log(
    '=== 2J.25-B SETUP PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.25-B SETUP ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });