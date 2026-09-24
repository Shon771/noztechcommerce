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
    '=== 2J.22-A MISSING ORDER CANCELLATION PROTECTION TEST ===',
  );

  const missingOrderId =
    '00000000-0000-4000-8000-000000000000';

  const order =
    await prisma.order.findUnique({
      where: {
        id: missingOrderId,
      },
    });

  if (order) {
    throw new Error(
      'Test ID ternyata sudah digunakan oleh order.',
    );
  }

  console.log(
    'MISSING ORDER ID:',
    missingOrderId,
  );

  console.log(
    'ORDER EXISTS:',
    'NO',
  );

  console.log(
    'INITIAL MISSING ORDER STATE: PASS',
  );

  console.log(
    '=== 2J.22-A SETUP PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.22-A SETUP ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });