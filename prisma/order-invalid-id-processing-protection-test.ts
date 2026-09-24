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
    '=== 2J.23-C INVALID ORDER ID PROCESSING PROTECTION TEST ===',
  );

  const invalidOrderId =
    'not-a-valid-order-id-process';

  console.log(
    'INVALID ORDER ID:',
    invalidOrderId,
  );

  console.log(
    'EXPECTED FORMAT:',
    'UUID',
  );

  if (
    invalidOrderId ===
    '00000000-0000-4000-8000-000000000002'
  ) {
    throw new Error(
      'Invalid ID test value unexpectedly changed.',
    );
  }

  console.log(
    'INVALID ID FIXTURE: PASS',
  );

  console.log(
    '=== 2J.23-C SETUP PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.23-C SETUP ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });