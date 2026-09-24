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
    '=== 2J.24-D ORDER PAYMENT AMOUNT SOURCE-OF-TRUTH FINAL READ-BACK ===',
  );

  const orderId =
    '0a48a87e-7671-419a-9bc5-289f255174d5';

  const paymentId =
    '512b1b1c-87dd-4314-aaff-dcc7035de0fa';

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
      'Payment seharusnya tetap ada.',
    );
  }

  const orderTotal =
    Number(order.total);

  const paymentAmount =
    Number(order.payment.amount);

  console.log(
    'ORDER ID:',
    order.id,
  );

  console.log(
    'ORDER TOTAL:',
    orderTotal,
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
    'PAYMENT AMOUNT:',
    paymentAmount,
  );

  console.log(
    'PAYMENT STATUS:',
    order.payment.status,
  );

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

  if (orderTotal !== paymentAmount) {
    throw new Error(
      `Order total (${orderTotal}) tidak sama dengan payment amount (${paymentAmount}).`,
    );
  }

  console.log(
    'PAYMENT RELATION PRESERVED: PASS',
  );

  console.log(
    'ORDER TOTAL ↔ PAYMENT AMOUNT PRESERVED: PASS',
  );

  console.log(
    'SOURCE OF TRUTH PERSISTENCE: PASS',
  );

  console.log(
    '=== 2J.24-D FINAL READ-BACK PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.24-D FINAL READ-BACK ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });