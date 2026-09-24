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
    '=== 2J.26-F SHIPPED ORDER PAYMENT CONSISTENCY RUNTIME TEST ===',
  );

  const orderId =
    '1e45e879-da38-4159-9ebd-aebf69b2ac25';

  const paymentId =
    '804f07cd-88bd-49e4-9ee0-9672becc2c37';

  const paymentService =
    new PaymentService(prisma as any);

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

  let rejected = false;

  try {
    const result =
      await paymentService.confirmPayment(
        paymentId,
        `TX-2J26-F-${Date.now()}`,
      );

    console.log(
      'CONFIRM PAYMENT ACCEPTED: OBSERVED',
    );

    console.log(
      'CONFIRM PAYMENT RESULT:',
      result.status,
    );
  } catch (error) {
    rejected = true;

    console.log(
      'CONFIRM PAYMENT REJECTED: OBSERVED',
    );

    console.log(
      'ERROR TYPE:',
      error?.constructor?.name,
    );

    console.log(
      'ERROR:',
      error instanceof Error
        ? error.message
        : String(error),
    );
  }

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
      'Order hilang setelah confirmation attempt.',
    );
  }

  if (!afterPayment) {
    throw new Error(
      'Payment hilang setelah confirmation attempt.',
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
    'PAYMENT ORDER ID AFTER:',
    afterPayment.orderId,
  );

  if (afterOrder.status !== 'SHIPPED') {
    throw new Error(
      `Order berubah menjadi ${afterOrder.status}.`,
    );
  }

  if (afterPayment.orderId !== orderId) {
    throw new Error(
      'Payment → Order relation berubah.',
    );
  }

  console.log(
    'SHIPPED ORDER STATE PRESERVED: PASS',
  );

  console.log(
    'PAYMENT → ORDER RELATION PRESERVED: PASS',
  );

  if (rejected) {
    console.log(
      'PAYMENT CONFIRMATION BEHAVIOR: REJECTED',
    );
  } else {
    console.log(
      'PAYMENT CONFIRMATION BEHAVIOR: ACCEPTED',
    );
  }

  if (afterPayment.status === 'PAID') {
    console.log(
      'PAYMENT PROMOTED TO PAID: OBSERVED',
    );
  } else {
    console.log(
      'PAYMENT NOT PROMOTED TO PAID: OBSERVED',
    );
  }

  console.log(
    '=== 2J.26-F RUNTIME TEST COMPLETE ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.26-F RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });