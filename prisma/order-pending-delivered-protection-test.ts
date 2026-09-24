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
    '=== 2J.15-B PENDING DELIVERED PROTECTION TEST ===',
  );

  const customer =
    await prisma.customer.create({
      data: {
        name: '2J15-B Pending Delivered',
        telegramId: `TEST-2J15-B-${Date.now()}`,
      },
    });

  const order =
    await prisma.order.create({
      data: {
        orderNumber: `NT-2J15-B-${Date.now()}`,
        status: 'PENDING',
        subtotal: 10000,
        shippingCost: 0,
        discount: 0,
        total: 10000,
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

  if (order.status !== 'PENDING') {
    throw new Error(
      `Expected PENDING, got ${order.status}`,
    );
  }

  console.log(
    'INITIAL PENDING STATE: PASS',
  );

  console.log(
    '=== 2J.15-B SETUP PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.15-B SETUP ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });