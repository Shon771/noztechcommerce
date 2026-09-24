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
    '=== 2J.26-A V2 CANCELLED ORDER PAYMENT PROTECTION RUNTIME TEST ===',
  );

  const orderId =
    'c818814e-eb36-465e-8a65-f64bbf56bb94';

  const paymentId =
    'ca68a6c2-acc9-4079-b785-d5b6b43595cd';

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
    await paymentService.confirmPayment(
      paymentId,
      `TX-2J26-A-V2-${Date.now()}`,
    );
  } catch (error) {
    rejected = true;

    console.log(
      'CONFIRM PAYMENT REJECTED: PASS',
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

  if (!rejected) {
    throw new Error(
      'Payment untuk Order CANCELLED berhasil dikonfirmasi. Protection gagal.',
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

  if (afterOrder.status !== 'CANCELLED') {
    throw new Error(
      `Order berubah menjadi ${afterOrder.status}.`,
    );
  }

  if (afterPayment.status !== 'PENDING') {
    throw new Error(
      `Payment berubah menjadi ${afterPayment.status}.`,
    );
  }

  if (afterPayment.orderId !== orderId) {
    throw new Error(
      'Payment → Order relation berubah.',
    );
  }

  console.log(
    'CANCELLED ORDER STATE PRESERVED: PASS',
  );

  console.log(
    'PAYMENT PENDING STATE PRESERVED: PASS',
  );

  console.log(
    'PAYMENT NOT PROMOTED TO PAID: PASS',
  );

  console.log(
    'PAYMENT → ORDER RELATION PRESERVED: PASS',
  );

  console.log(
    '=== 2J.26-A V2 RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.26-A V2 RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });