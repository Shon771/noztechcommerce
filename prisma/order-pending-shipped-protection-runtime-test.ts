import 'dotenv/config';

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import { OrderService } from '../src/modules/order/order.service';
import { PromoService } from '../src/modules/promo/promo.service';
import { PaymentService } from '../src/modules/payment/payment.service';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log(
    '=== 2J.14-B PENDING SHIPPED PROTECTION RUNTIME TEST ===',
  );

  const orderId =
    'e8365c5c-7e9b-4a67-b09e-423a4913827a';

  const orderService =
    new OrderService(
      prisma as any,
      new PromoService(prisma as any),
      new PaymentService(prisma as any),
    );

  const before =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!before) {
    throw new Error(
      'Order tidak ditemukan.',
    );
  }

  console.log(
    'ORDER ID:',
    before.id,
  );

  console.log(
    'ORDER NUMBER:',
    before.orderNumber,
  );

  console.log(
    'ORDER STATUS BEFORE:',
    before.status,
  );

  if (before.status !== 'PENDING') {
    throw new Error(
      `Expected PENDING, got ${before.status}`,
    );
  }

  try {
    await orderService.shipOrder(
      orderId,
    );

    throw new Error(
      'Order PENDING berhasil dikirim menjadi SHIPPED.',
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        'Order PENDING berhasil dikirim menjadi SHIPPED.'
    ) {
      throw error;
    }

    console.log(
      'SHIP ORDER REJECTED: PASS',
    );

    console.log(
      'ERROR:',
      error instanceof Error
        ? error.message
        : error,
    );

    const expectedMessage =
      'Pesanan dengan status PENDING tidak dapat dikirim.';

    if (
      !(error instanceof Error) ||
      error.message !== expectedMessage
    ) {
      throw new Error(
        `Unexpected error message: ${
          error instanceof Error
            ? error.message
            : error
        }`,
      );
    }

    console.log(
      'EXPECTED PENDING PROTECTION ERROR: PASS',
    );
  }

  const after =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!after) {
    throw new Error(
      'Order tidak ditemukan setelah runtime test.',
    );
  }

  console.log(
    'ORDER STATUS AFTER:',
    after.status,
  );

  if (after.status !== 'PENDING') {
    throw new Error(
      `Order berubah! Expected PENDING, got ${after.status}`,
    );
  }

  console.log(
    'ORDER REMAINS PENDING: PASS',
  );

  console.log(
    '=== 2J.14-B RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.14-B RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });