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
    '=== 2J.24-C ORDER PAYMENT AMOUNT CONSISTENCY TEST ===',
  );

  const customer = await prisma.customer.create({
    data: {
      name: '2J24-C Amount Consistency Customer',
      telegramId: `2j24c-${Date.now()}`,
    },
  });

  const order = await prisma.order.create({
    data: {
      orderNumber: `NT-2J24-C-${Date.now()}`,
      status: 'PENDING',
      subtotal: 35000,
      shippingCost: 5000,
      discount: 5000,
      total: 35000,
      customerId: customer.id,
    },
  });

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      amount: 35000,
      method: 'QRIS',
      status: 'PENDING',
    },
  });

  const orderTotal =
    Number(order.total);

  const paymentAmount =
    Number(payment.amount);

  console.log(
    'ORDER ID:',
    order.id,
  );

  console.log(
    'ORDER NUMBER:',
    order.orderNumber,
  );

  console.log(
    'ORDER TOTAL:',
    orderTotal,
  );

  console.log(
    'PAYMENT ID:',
    payment.id,
  );

  console.log(
    'PAYMENT AMOUNT:',
    paymentAmount,
  );

  if (orderTotal !== paymentAmount) {
    throw new Error(
      `Order total (${orderTotal}) tidak sama dengan payment amount (${paymentAmount}).`,
    );
  }

  console.log(
    'ORDER TOTAL ↔ PAYMENT AMOUNT: PASS',
  );

  console.log(
    'AMOUNT CONSISTENCY STATE: PASS',
  );

  console.log(
    '=== 2J.24-C SETUP PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.24-C SETUP ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });