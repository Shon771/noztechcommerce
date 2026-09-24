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
    '=== 2J.19-B CONFIRMED CANCELLATION TRANSITION RUNTIME TEST ===',
  );

  const orderId =
    '2079bd2e-b83b-44a4-89a3-807e099db258';

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

  if (before.status !== 'CONFIRMED') {
    throw new Error(
      `Expected CONFIRMED, got ${before.status}`,
    );
  }

  const result =
    await orderService.cancelOrder(
      orderId,
    );

  console.log(
    'CANCEL ORDER RESULT:',
    result.status,
  );

  if (result.status !== 'CANCELLED') {
    throw new Error(
      `Expected CANCELLED, got ${result.status}`,
    );
  }

  console.log(
    'CONFIRMED → CANCELLED: PASS',
  );

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

  if (after.status !== 'CANCELLED') {
    throw new Error(
      `Persistence failed! Expected CANCELLED, got ${after.status}`,
    );
  }

  console.log(
    'CANCELLED STATE PERSISTENCE: PASS',
  );

  console.log(
    '=== 2J.19-B RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.19-B RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });