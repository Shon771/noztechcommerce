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
    '=== 2J.27-D ORDER TRANSITION SHIPPED → DELIVERED RUNTIME TEST ===',
  );

  const orderId =
    '2909320b-b9ba-4790-a253-42ea6837b9a5';

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

  if (beforeOrder.status !== 'SHIPPED') {
    throw new Error(
      `Order harus SHIPPED sebelum transition, tetapi ${beforeOrder.status}.`,
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

  const afterOrder =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!afterOrder) {
    throw new Error(
      'Order hilang setelah delivery.',
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

  if (result.status !== 'DELIVERED') {
    throw new Error(
      `deliverOrder() menghasilkan ${result.status}, bukan DELIVERED.`,
    );
  }

  if (afterOrder.status !== 'DELIVERED') {
    throw new Error(
      `Order tidak tersimpan sebagai DELIVERED. Status: ${afterOrder.status}`,
    );
  }

  if (afterOrder.id !== orderId) {
    throw new Error(
      'Order ID berubah setelah transition.',
    );
  }

  console.log(
    'SHIPPED → DELIVERED TRANSITION: PASS',
  );

  console.log(
    'ORDER ID PRESERVED: PASS',
  );

  console.log(
    'DELIVERED STATE PERSISTED: PASS',
  );

  console.log(
    '=== 2J.27-D RUNTIME TEST PASS ===',
  );
}

main()
  .catch((error) => {
    console.error(
      '=== 2J.27-D RUNTIME TEST ERROR ===',
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });