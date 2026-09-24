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
    '=== 2J.14-C SHIPPED IDEMPOTENCY RUNTIME TEST ===',
  );

  const orderId =
    '2b94f9a4-a4c9-4aa5-9e87-96ef92dfd316';

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

  const first =
    await orderService.shipOrder(
      orderId,
    );

  console.log(
    'FIRST SHIP RESULT:',
    first.status,
  );

  if (first.status !== 'SHIPPED') {
    throw new Error(
      `First ship changed status to ${first.status}`,
    );
  }

  console.log(
    'FIRST SHIP: PASS',
  );

  const second =
    await orderService.shipOrder(
      orderId,
    );

  console.log(
    'SECOND SHIP RESULT:',
    second.status,
  );

  if (second.status !== 'SHIPPED') {
    throw new Error(
      `Second ship changed status to ${second.status}`,
    );
  }

  console.log(
    'SECOND SHIP: PASS',
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
      `Shipped state tidak preserved. Expected SHIPPED, got ${after.status}`,
    );
  }

  console.log(
    'SHIPPED STATE PRESERVED: PASS',
  );

  console.log(
    '=== 2J.14-C RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.14-C RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });