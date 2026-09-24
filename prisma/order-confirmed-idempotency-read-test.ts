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
    '=== 2J.12-B CONFIRMED IDEMPOTENCY FINAL READ-BACK ===',
  );

  const order =
    await prisma.order.findUnique({
      where: {
        id: '8b12560e-4430-486e-ab7b-01db9da686cb',
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

  if (order.status !== 'CONFIRMED') {
    throw new Error(
      `Expected CONFIRMED, got ${order.status}`,
    );
  }

  console.log(
    'CONFIRMED STATE PRESERVED: PASS',
  );

  console.log(
    'IDEMPOTENCY PERSISTENCE: PASS',
  );

  console.log(
    '=== 2J.12-B FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.12-B FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });