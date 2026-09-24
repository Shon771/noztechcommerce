import 'dotenv/config';

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import { OrderService } from '../src/modules/order/order.service';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log(
    '=== 2J.27-C ORDER TRANSITION PROCESSING → SHIPPED RUNTIME TEST ===',
  );

  const orderId =
    '2cc1ef41-6462-497f-8a94-7c444399176f';

  const orderService =
    new OrderService(
      prisma as any,
      null as any,
      null as any,
    );

  const beforeOrder =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!beforeOrder) {
    throw new Error(
      'Order fixture tidak ditemukan.',
    );
  }

  console.log(
    'ORDER STATUS BEFORE:',
    beforeOrder.status,
  );

  if (beforeOrder.status !== 'PROCESSING') {
    throw new Error(
      `Order harus PROCESSING sebelum transition, tetapi ${beforeOrder.status}.`,
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

  const afterOrder =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!afterOrder) {
    throw new Error(
      'Order hilang setelah shipping.',
    );
  }

  console.log(
    'ORDER STATUS AFTER:',
    afterOrder.status,
  );

  console.log(
    'ORDER ID AFTER:',
    afterOrder.id,
  );

  if (result.status !== 'SHIPPED') {
    throw new Error(
      `shipOrder() menghasilkan ${result.status}, bukan SHIPPED.`,
    );
  }

  if (afterOrder.status !== 'SHIPPED') {
    throw new Error(
      `Order tidak tersimpan sebagai SHIPPED. Status: ${afterOrder.status}`,
    );
  }

  if (afterOrder.id !== orderId) {
    throw new Error(
      'Order ID berubah setelah transition.',
    );
  }

  console.log(
    'PROCESSING → SHIPPED TRANSITION: PASS',
  );

  console.log(
    'ORDER ID PRESERVED: PASS',
  );

  console.log(
    'SHIPPED STATE PERSISTED: PASS',
  );

  console.log(
    '=== 2J.27-C RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.27-C RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });