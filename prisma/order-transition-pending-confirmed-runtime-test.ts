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
    '=== 2J.27-A ORDER TRANSITION PENDING → CONFIRMED RUNTIME TEST ===',
  );

  const orderId =
    '14e42672-d68b-48d1-add3-8d39c908e693';

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

  if (beforeOrder.status !== 'PENDING') {
    throw new Error(
      `Order harus PENDING sebelum transition, tetapi ${beforeOrder.status}.`,
    );
  }

  const result =
    await orderService.confirmOrder(
      orderId,
    );

  console.log(
    'CONFIRM ORDER RESULT:',
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
      'Order hilang setelah confirmation.',
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

  if (result.status !== 'CONFIRMED') {
    throw new Error(
      `confirmOrder() menghasilkan ${result.status}, bukan CONFIRMED.`,
    );
  }

  if (afterOrder.status !== 'CONFIRMED') {
    throw new Error(
      `Order tidak tersimpan sebagai CONFIRMED. Status: ${afterOrder.status}`,
    );
  }

  if (afterOrder.id !== orderId) {
    throw new Error(
      'Order ID berubah setelah transition.',
    );
  }

  console.log(
    'PENDING → CONFIRMED TRANSITION: PASS',
  );

  console.log(
    'ORDER ID PRESERVED: PASS',
  );

  console.log(
    'CONFIRMED STATE PERSISTED: PASS',
  );

  console.log(
    '=== 2J.27-A RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.27-A RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });