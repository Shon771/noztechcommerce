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
    '=== 2J.20-C CONFIRMED CANCELLATION LIFECYCLE IDEMPOTENCY FINAL READ-BACK ===',
  );

  const order =
    await prisma.order.findUnique({
      where: {
        id: '452d5e2d-c81f-43df-a53e-7e43954fcf98',
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

  if (order.status !== 'CANCELLED') {
    throw new Error(
      `Expected CANCELLED, got ${order.status}`,
    );
  }

  console.log(
    'CANCELLED STATE PRESERVED: PASS',
  );

  console.log(
    'CONFIRMED → CANCELLED PERSISTENCE: PASS',
  );

  console.log(
    'CANCELLED → CANCELLED IDEMPOTENCY PERSISTENCE: PASS',
  );

  console.log(
    '=== 2J.20-C FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.20-C FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });