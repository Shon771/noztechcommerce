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
    '=== 2J.26-B DELIVERED ORDER PAYMENT CONSISTENCY RUNTIME TEST ===',
  );

  const orderId =
    '159b2a7a-1333-4472-a8b9-4fd0b8e9b0e4';

  const paymentId =
    'bd26b8d7-e0a2-4bc1-a729-2261decb9486';

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
  let confirmationResult: unknown = null;

  try {
    confirmationResult =
      await paymentService.confirmPayment(
        paymentId,
        `TX-2J26-B-${Date.now()}`,
      );

    console.log(
      'CONFIRM PAYMENT ACCEPTED: OBSERVED',
    );

    console.log(
      'CONFIRM PAYMENT RESULT:',
      (confirmationResult as any)?.status,
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

  if (afterOrder.status !== 'DELIVERED') {
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
    'DELIVERED ORDER STATE PRESERVED: PASS',
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
    '=== 2J.26-B RUNTIME TEST COMPLETE ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.26-B RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });