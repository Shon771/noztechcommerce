import 'dotenv/config';

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import { PaymentConfirmationService } from '../src/modules/payment/payment-confirmation.service';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log(
    '=== 2J.31-I4 PAYMENT CONFIRMATION ↔ ORDER BOUNDARY RUNTIME TEST ===',
  );

  const customer = await prisma.customer.create({
    data: {
      name: '2J31-I4 Boundary Customer',
      telegramId: `2j31i4-${Date.now()}`,
    },
  });

  const order = await prisma.order.create({
    data: {
      orderNumber: `NT-2J31-I4-${Date.now()}`,
      status: 'PENDING',
      subtotal: 50000,
      shippingCost: 0,
      discount: 0,
      total: 50000,
      customerId: customer.id,
    },
  });

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      amount: order.total,
      method: 'QRIS',
      status: 'PENDING',
    },
  });

  console.log('ORDER ID:', order.id);
  console.log('PAYMENT ID:', payment.id);
  console.log('ORDER STATUS BEFORE:', order.status);
  console.log('PAYMENT STATUS BEFORE:', payment.status);

  const confirmationService =
    new PaymentConfirmationService(
      prisma as any,
    );

  const result =
    await confirmationService.confirm(
      payment.id,
      `TX-2J31-I4-${Date.now()}`,
    );

  console.log(
    'PAYMENT STATUS RESULT:',
    result.payment.status,
  );

  console.log(
    'ORDER STATUS RESULT:',
    result.order.status,
  );

  const afterOrder =
    await prisma.order.findUnique({
      where: {
        id: order.id,
      },
      include: {
        payment: true,
      },
    });

  if (!afterOrder) {
    throw new Error(
      'Order hilang setelah confirmation.',
    );
  }

  if (!afterOrder.payment) {
    throw new Error(
      'Payment hilang setelah confirmation.',
    );
  }

  if (afterOrder.status !== 'CONFIRMED') {
    throw new Error(
      `Order seharusnya CONFIRMED, tetapi status=${afterOrder.status}.`,
    );
  }

  if (afterOrder.payment.status !== 'PAID') {
    throw new Error(
      `Payment seharusnya PAID, tetapi status=${afterOrder.payment.status}.`,
    );
  }

  if (
    afterOrder.payment.orderId !==
    afterOrder.id
  ) {
    throw new Error(
      'Payment tidak lagi terhubung ke Order yang benar.',
    );
  }

  if (afterOrder.payment.paidAt === null) {
    throw new Error(
      'paidAt tidak tersimpan.',
    );
  }

  console.log(
    'PAYMENT PENDING → PAID: PASS',
  );

  console.log(
    'ORDER PENDING → CONFIRMED: PASS',
  );

  console.log(
    'PAYMENT → ORDER RELATION: PASS',
  );

  console.log(
    'PAID TIMESTAMP PERSISTENCE: PASS',
  );

  console.log(
    'CONFIRMATION BOUNDARY: PASS',
  );

  console.log(
    '=== 2J.31-I4 RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.31-I4 RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });