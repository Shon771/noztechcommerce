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
    '=== 2J.24-A ORDER PAYMENT CONSISTENCY MISSING PAYMENT RUNTIME TEST ===',
  );

  const orderId =
    '0ca13638-a931-4763-8d38-ab8e727beb03';

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

  const paymentService =
    new PaymentService(
      prisma as any,
    );

  const payment =
    await paymentService.findByOrderId(
      orderId,
    );

  console.log(
    'ORDER ID:',
    orderId,
  );

  console.log(
    'ORDER STATUS:',
    order.status,
  );

  console.log(
    'PAYMENT RESULT:',
    payment ? 'FOUND' : 'NOT_FOUND',
  );

  if (payment) {
    throw new Error(
      'Payment seharusnya tidak ditemukan.',
    );
  }

  console.log(
    'ORDER WITHOUT PAYMENT DETECTED: PASS',
  );

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

  if (paymentCount !== 0) {
    throw new Error(
      'Order ternyata memiliki payment.',
    );
  }

  console.log(
    'PAYMENT CONSISTENCY STATE PRESERVED: PASS',
  );

  console.log(
    '=== 2J.24-A RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.24-A RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });