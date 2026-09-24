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
    '=== 2J.15-A ORDER DELIVERED TRANSITION RUNTIME TEST ===',
  );

  const orderId =
    'a1fafb1d-f4ec-4006-adb0-a81845f54d61';

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

  if (before.status !== 'SHIPPED') {
    throw new Error(
      `Expected SHIPPED, got ${before.status}`,
    );
  }

  const result =
    await orderService.deliverOrder(
      orderId,
    );

  console.log(
    'DELIVER ORDER RESULT:',
    result.status,
  );

  if (result.status !== 'DELIVERED') {
    throw new Error(
      `Expected DELIVERED, got ${result.status}`,
    );
  }

  console.log(
    'SHIPPED → DELIVERED: PASS',
  );

  const after =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!after) {
    throw new Error(
      'Order tidak ditemukan setelah delivery.',
    );
  }

  console.log(
    'ORDER STATUS AFTER:',
    after.status,
  );

  if (after.status !== 'DELIVERED') {
    throw new Error(
      `Order tidak tersimpan sebagai DELIVERED. Got ${after.status}`,
    );
  }

  console.log(
    'DELIVERED STATE PERSISTENCE: PASS',
  );

  console.log(
    '=== 2J.15-A RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.15-A RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });