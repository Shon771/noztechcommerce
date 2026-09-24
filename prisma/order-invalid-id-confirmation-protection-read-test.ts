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
    '=== 2J.23-B INVALID ORDER ID CONFIRMATION FINAL READ-BACK ===',
  );

  const invalidOrderId =
    'not-a-valid-order-id-confirm';

  const matchingOrders =
    await prisma.order.findMany({
      where: {
        id: invalidOrderId,
      },
    });

  console.log(
    'ORDER ID:',
    invalidOrderId,
  );

  console.log(
    'MATCHING ORDER COUNT:',
    matchingOrders.length,
  );

  if (matchingOrders.length !== 0) {
    throw new Error(
      'Invalid ID unexpectedly matched an order.',
    );
  }

  console.log(
    'INVALID ID NOT RESOLVED TO ORDER: PASS',
  );

  console.log(
    'INVALID ID PROTECTION: PASS',
  );

  console.log(
    '=== 2J.23-B FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.23-B FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });