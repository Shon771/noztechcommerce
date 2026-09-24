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
    '=== 2J.14-A ORDER SHIPPED TRANSITION RUNTIME TEST ===',
  );

  const orderId =
    '1ce489d2-5a65-41bd-9d9e-ef47bb56a400';

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

  if (before.status !== 'PROCESSING') {
    throw new Error(
      `Expected PROCESSING, got ${before.status}`,
    );
  }

  const result =
    await orderService.shipOrder(
      orderId,
    );

  console.log(
    'SHIP ORDER RESULT:',
    result.status,
  );

  if (result.status !== 'SHIPPED') {
    throw new Error(
      `Expected SHIPPED, got ${result.status}`,
    );
  }

  console.log(
    'PROCESSING → SHIPPED: PASS',
  );

  const after =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!after) {
    throw new Error(
      'Order tidak ditemukan setelah shipping.',
    );
  }

  console.log(
    'ORDER STATUS AFTER:',
    after.status,
  );

  if (after.status !== 'SHIPPED') {
    throw new Error(
      `Order tidak tersimpan sebagai SHIPPED. Got ${after.status}`,
    );
  }

  console.log(
    'SHIPPED STATE PERSISTENCE: PASS',
  );

  console.log(
    '=== 2J.14-A RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.14-A RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });