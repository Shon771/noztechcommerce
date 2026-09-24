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
    '=== 2J.24-A ORDER PAYMENT CONSISTENCY MISSING PAYMENT TEST ===',
  );

  const customer = await prisma.customer.create({
    data: {
      name: '2J24-A Payment Consistency Customer',
      telegramId: `2j24a-${Date.now()}`,
    },
  });

  const order = await prisma.order.create({
    data: {
      orderNumber: `NT-2J24-A-${Date.now()}`,
      status: 'PENDING',
      subtotal: 10000,
      shippingCost: 0,
      discount: 0,
      total: 10000,
      customerId: customer.id,
    },
  });

  const payment = await prisma.payment.findUnique({
    where: {
      orderId: order.id,
    },
  });

  if (payment) {
    throw new Error(
      'Payment seharusnya belum ada.',
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
    'PAYMENT EXISTS:',
    'NO',
  );

  console.log(
    'ORDER WITHOUT PAYMENT STATE: PASS',
  );

  console.log(
    '=== 2J.24-A SETUP PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.24-A SETUP ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });