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
    '=== 2J.24-B ORDER PAYMENT CONSISTENCY SINGLE PAYMENT FINAL READ-BACK ===',
  );

  const orderId =
    '9a106ba5-535b-4acb-be4a-f3598e8926fa';

  const paymentId =
    'f95c2c75-8b1d-4907-a953-0eaf74957a34';

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
    'PAYMENT ID:',
    order.payment?.id ?? 'NONE',
  );

  console.log(
    'PAYMENT ORDER ID:',
    order.payment?.orderId ?? 'NONE',
  );

  console.log(
    'PAYMENT STATUS:',
    order.payment?.status ?? 'NONE',
  );

  if (!order.payment) {
    throw new Error(
      'Payment seharusnya tetap ada.',
    );
  }

  if (order.payment.id !== paymentId) {
    throw new Error(
      'Payment ID berubah atau tidak sesuai.',
    );
  }

  if (order.payment.orderId !== orderId) {
    throw new Error(
      'Payment orderId berubah atau salah.',
    );
  }

  const paymentCount =
    await prisma.payment.count({
      where: {
        orderId,
      },
    });

  console.log(
    'PAYMENT COUNT:',
    paymentCount,
  );

  if (paymentCount !== 1) {
    throw new Error(
      `Expected exactly 1 payment, found ${paymentCount}.`,
    );
  }

  console.log(
    'PAYMENT RELATION PRESERVED: PASS',
  );

  console.log(
    'PAYMENT → ORDER INTEGRITY PRESERVED: PASS',
  );

  console.log(
    'SINGLE PAYMENT CONSTRAINT PRESERVED: PASS',
  );

  console.log(
    '=== 2J.24-B FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.24-B FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });