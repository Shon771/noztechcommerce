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
    '=== 2J.14-A ORDER SHIPPED FINAL READ-BACK ===',
  );

  const order =
    await prisma.order.findUnique({
      where: {
        id: '1ce489d2-5a65-41bd-9d9e-ef47bb56a400',
      },
    });

  if (!order) {
    throw new Error(
      'Order tidak ditemukan.',
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

  if (order.status !== 'SHIPPED') {
    throw new Error(
      `Expected SHIPPED, got ${order.status}`,
    );
  }

  console.log(
    'SHIPPED STATE PRESERVED: PASS',
  );

  console.log(
    'PROCESSING → SHIPPED PERSISTENCE: PASS',
  );

  console.log(
    '=== 2J.14-A FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.14-A FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });