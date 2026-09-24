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
    '=== 2J.26-D CONFIRMED ORDER PAYMENT CONSISTENCY FINAL READ-BACK ===',
  );

  const orderId =
    '8e23d5c1-6ce0-4e98-9ef9-84550dd28b33';

  const paymentId =
    '527295b0-de5d-4999-b75e-71157750f10d';

  const order =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  const payment =
    await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
    });

  if (!order) {
    throw new Error(
      'Order fixture tidak ditemukan.',
    );
  }

  if (!payment) {
    throw new Error(
      'Payment fixture tidak ditemukan.',
    );
  }

  if (order.status !== 'CONFIRMED') {
    throw new Error(
      `Order seharusnya CONFIRMED, tetapi ${order.status}.`,
    );
  }

  if (payment.status !== 'PAID') {
    throw new Error(
      `Payment seharusnya PAID, tetapi ${payment.status}.`,
    );
  }

  if (payment.orderId !== orderId) {
    throw new Error(
      'Payment → Order relation berubah.',
    );
  }

  if (!payment.paidAt) {
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
    payment.id,
  );

  console.log(
    'PAYMENT ORDER ID:',
    payment.orderId,
  );

  console.log(
    'PAYMENT STATUS:',
    payment.status,
  );

  console.log(
    'PAID AT:',
    payment.paidAt,
  );

  console.log(
    'CONFIRMED ORDER STATE PERSISTED: PASS',
  );

  console.log(
    'PAYMENT PAID STATE PERSISTED: PASS',
  );

  console.log(
    'PAYMENT → ORDER RELATION PRESERVED: PASS',
  );

  console.log(
    'PAID TIMESTAMP PERSISTED: PASS',
  );

  console.log(
    'CONFIRMED + PAID STATE CONSISTENCY: PASS',
  );

  console.log(
    '=== 2J.26-D FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.26-D FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });