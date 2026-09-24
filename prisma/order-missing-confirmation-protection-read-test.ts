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
    '=== 2J.22-B MISSING ORDER CONFIRMATION FINAL READ-BACK ===',
  );

  const missingOrderId =
    '00000000-0000-4000-8000-000000000001';

  const order =
    await prisma.order.findUnique({
      where: {
        id: missingOrderId,
      },
    });

  console.log(
    'ORDER ID:',
    missingOrderId,
  );

  console.log(
    'ORDER EXISTS:',
    order ? 'YES' : 'NO',
  );

  if (order) {
    throw new Error(
      'Order seharusnya tidak ada.',
    );
  }

  console.log(
    'MISSING ORDER STATE PRESERVED: PASS',
  );

  console.log(
    'NOT FOUND PROTECTION: PASS',
  );

  console.log(
    '=== 2J.22-B FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.22-B FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });