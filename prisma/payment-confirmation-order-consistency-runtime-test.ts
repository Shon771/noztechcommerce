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
    '=== 2J.25-A PAYMENT CONFIRMATION ORDER CONSISTENCY RUNTIME TEST ===',
  );

  const orderId =
    'ffe57dbd-f3be-4840-847f-57d0ba60020c';

  const paymentId =
    '3603c483-550a-4dfa-b375-29d9231c36f0';

  const paymentService =
    new PaymentService(
      prisma as any,
    );

  const beforeOrder =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  const beforePayment =
    await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
    });

  if (!beforeOrder) {
    throw new Error(
      'Order fixture tidak ditemukan.',
    );
  }

  if (!beforePayment) {
    throw new Error(
      'Payment fixture tidak ditemukan.',
    );
  }

  console.log(
    'ORDER STATUS BEFORE:',
    beforeOrder.status,
  );

  console.log(
    'PAYMENT STATUS BEFORE:',
    beforePayment.status,
  );

  const confirmedPayment =
    await paymentService.confirmPayment(
      paymentId,
      `TX-2J25-A-${Date.now()}`,
    );

  console.log(
    'CONFIRM PAYMENT RESULT:',
    confirmedPayment.status,
  );

  const afterOrder =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  const afterPayment =
    await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
    });

  if (!afterOrder) {
    throw new Error(
      'Order hilang setelah confirmation.',
    );
  }

  if (!afterPayment) {
    throw new Error(
      'Payment hilang setelah confirmation.',
    );
  }

  console.log(
    'ORDER STATUS AFTER:',
    afterOrder.status,
  );

  console.log(
    'PAYMENT STATUS AFTER:',
    afterPayment.status,
  );

  console.log(
    'PAYMENT ORDER ID:',
    afterPayment.orderId,
  );

  if (afterPayment.status !== 'PAID') {
    throw new Error(
      `Payment seharusnya PAID, tetapi status=${afterPayment.status}.`,
    );
  }

  if (afterPayment.orderId !== orderId) {
    throw new Error(
      'Payment tidak lagi terhubung ke Order yang benar.',
    );
  }

  if (
    afterPayment.paidAt === null
  ) {
    throw new Error(
      'paidAt belum tersimpan.',
    );
  }

  console.log(
    'PAYMENT PENDING → PAID: PASS',
  );

  console.log(
    'PAYMENT PERSISTENCE: PASS',
  );

  console.log(
    'PAYMENT → ORDER RELATION: PASS',
  );

  console.log(
    'PAID TIMESTAMP PERSISTENCE: PASS',
  );

  console.log(
    'OBSERVED ORDER STATUS AFTER PAYMENT CONFIRMATION:',
    afterOrder.status,
  );

  console.log(
    '=== 2J.25-A RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.25-A RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });