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
    '=== 2J.16-B DELIVERED SHIPPED PROTECTION RUNTIME TEST ===',
  );

  const orderId =
    'd873d59d-8f9e-499f-9a2b-544e80787275';

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

  if (before.status !== 'DELIVERED') {
    throw new Error(
      `Expected DELIVERED, got ${before.status}`,
    );
  }

  try {
    await orderService.shipOrder(
      orderId,
    );

    throw new Error(
      'Order DELIVERED berhasil dikirim kembali menjadi SHIPPED.',
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        'Order DELIVERED berhasil dikirim kembali menjadi SHIPPED.'
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

  if (after.status !== 'DELIVERED') {
    throw new Error(
      `Order berubah! Expected DELIVERED, got ${after.status}`,
    );
  }

  console.log(
    'ORDER REMAINS DELIVERED: PASS',
  );

  console.log(
    '=== 2J.16-B RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.16-B RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });