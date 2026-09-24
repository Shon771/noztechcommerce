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
    '=== 2J.16-A DELIVERED PROCESSING PROTECTION RUNTIME TEST ===',
  );

  const orderId =
    '72431b2d-cba5-4b34-a9e4-b6f3b64f7bcf';

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
    await orderService.processOrder(
      orderId,
    );

    throw new Error(
      'Order DELIVERED berhasil diproses kembali menjadi PROCESSING.',
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        'Order DELIVERED berhasil diproses kembali menjadi PROCESSING.'
    ) {
      throw error;
    }

    console.log(
      'PROCESS ORDER REJECTED: PASS',
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
    '=== 2J.16-A RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.16-A RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });