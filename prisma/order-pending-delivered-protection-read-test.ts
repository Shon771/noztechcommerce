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
    '=== 2J.15-B PENDING DELIVERED FINAL READ-BACK ===',
  );

  const order =
    await prisma.order.findUnique({
      where: {
        id: '70b1b92d-3dbd-4d2c-b485-9f5c48aec251',
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

  if (order.status !== 'PENDING') {
    throw new Error(
      `Expected PENDING, got ${order.status}`,
    );
  }

  console.log(
    'PENDING STATE PRESERVED: PASS',
  );

  console.log(
    'DELIVERED TRANSITION BLOCKED: PASS',
  );

  console.log(
    '=== 2J.15-B FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.15-B FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });