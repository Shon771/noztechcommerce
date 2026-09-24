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
    '=== 2J.25-A PAYMENT CONFIRMATION ORDER CONSISTENCY FINAL READ-BACK ===',
  );

  const orderId =
    'ffe57dbd-f3be-4840-847f-57d0ba60020c';

  const paymentId =
    '3603c483-550a-4dfa-b375-29d9231c36f0';

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

  if (!order.payment) {
    throw new Error(
      'Payment fixture tidak ditemukan.',
    );
  }

  if (order.payment.id !== paymentId) {
    throw new Error(
      'Payment ID tidak sesuai fixture.',
    );
  }

  if (order.payment.orderId !== orderId) {
    throw new Error(
      'Payment tidak terhubung ke Order yang benar.',
    );
  }

  if (order.payment.status !== 'PAID') {
    throw new Error(
      `Payment seharusnya PAID, tetapi status=${order.payment.status}.`,
    );
  }

  if (order.status !== 'PENDING') {
    throw new Error(
      `Order seharusnya tetap PENDING, tetapi status=${order.status}.`,
    );
  }

  if (order.payment.paidAt === null) {
    throw new Error(
      'paidAt tidak tersimpan.',
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
    order.payment.id,
  );

  console.log(
    'PAYMENT ORDER ID:',
    order.payment.orderId,
  );

  console.log(
    'PAYMENT STATUS:',
    order.payment.status,
  );

  console.log(
    'PAID AT:',
    order.payment.paidAt,
  );

  console.log(
    'PAYMENT → ORDER RELATION PRESERVED: PASS',
  );

  console.log(
    'PAYMENT PAID STATE PERSISTED: PASS',
  );

  console.log(
    'ORDER PENDING STATE PRESERVED: PASS',
  );

  console.log(
    'PAID TIMESTAMP PERSISTED: PASS',
  );

  console.log(
    '=== 2J.25-A FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.25-A FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });