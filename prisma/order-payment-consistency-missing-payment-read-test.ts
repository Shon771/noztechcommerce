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
    '=== 2J.24-A ORDER PAYMENT CONSISTENCY MISSING PAYMENT FINAL READ-BACK ===',
  );

  const orderId =
    '0ca13638-a931-4763-8d38-ab8e727beb03';

  const order =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        payment: true,
      },
    });

  if (!order) {
    throw new Error(
      'Order fixture tidak ditemukan.',
    );
  }

  console.log(
    'ORDER ID:',
    order.id,
  );

  console.log(
    'ORDER STATUS:',
    order.status,
  );

  console.log(
    'PAYMENT EXISTS:',
    order.payment ? 'YES' : 'NO',
  );

  if (order.payment) {
    throw new Error(
      'Payment seharusnya tetap tidak ada.',
    );
  }

  console.log(
    'PAYMENT ABSENCE PRESERVED: PASS',
  );

  console.log(
    'ORDER ↔ PAYMENT CONSISTENCY: PASS',
  );

  console.log(
    '=== 2J.24-A FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.24-A FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });