import 'dotenv/config';

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import { PaymentService } from '../src/modules/payment/payment.service';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log(
    '=== 2J.24-B ORDER PAYMENT CONSISTENCY SINGLE PAYMENT RUNTIME TEST ===',
  );

  const orderId =
    '9a106ba5-535b-4acb-be4a-f3598e8926fa';

  const paymentId =
    'f95c2c75-8b1d-4907-a953-0eaf74957a34';

  const paymentService =
    new PaymentService(
      prisma as any,
    );

  const order =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!order) {
    throw new Error(
      'Order fixture tidak ditemukan.',
    );
  }

  const payment =
    await paymentService.findByOrderId(
      orderId,
    );

  if (!payment) {
    throw new Error(
      'Payment seharusnya ditemukan.',
    );
  }

  console.log(
    'ORDER ID:',
    order.id,
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
    'PAYMENT AMOUNT:',
    payment.amount.toString(),
  );

  console.log(
    'PAYMENT METHOD:',
    payment.method,
  );

  if (payment.id !== paymentId) {
    throw new Error(
      'Payment yang ditemukan bukan payment fixture.',
    );
  }

  if (payment.orderId !== orderId) {
    throw new Error(
      'Payment terhubung ke Order yang salah.',
    );
  }

  if (payment.order.id !== orderId) {
    throw new Error(
      'Payment relation mengarah ke Order yang salah.',
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
    'PAYMENT FOUND: PASS',
  );

  console.log(
    'PAYMENT → ORDER INTEGRITY: PASS',
  );

  console.log(
    'SINGLE PAYMENT CONSISTENCY: PASS',
  );

  console.log(
    '=== 2J.24-B RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.24-B RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });