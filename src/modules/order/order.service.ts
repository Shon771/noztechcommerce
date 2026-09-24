import {
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import { PromoService } from '../promo/promo.service';

import {
  PaymentService,
  type PaymentMethod,
} from '../payment/payment.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly promoService: PromoService,
    private readonly paymentService: PaymentService,
  ) {}

  async createFromCart(
    customerId: string,
    promoCode?: string,
    paymentMethod: PaymentMethod = 'COD',
  ) {
    const cart =
      await this.prisma.cart.findUnique({
        where: {
          customerId,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

    if (!cart || cart.items.length === 0) {
      throw new Error(
        'Keranjang kamu masih kosong.',
      );
    }

    // Validasi produk dan stock
    for (const item of cart.items) {
      if (item.product.status !== 'ACTIVE') {
        throw new Error(
          `Produk "${item.product.name}" tidak tersedia.`,
        );
      }

      if (
        item.quantity >
        item.product.stock
      ) {
        throw new Error(
          `Stok "${item.product.name}" tidak mencukupi.`,
        );
      }
    }

    // Hitung subtotal
    let subtotal = 0;

    for (const item of cart.items) {
      subtotal +=
        Number(item.product.price) *
        item.quantity;
    }

    const shippingCost = 0;

    let discount = 0;
    let promoId: string | null = null;

    // Validasi promo
    if (promoCode) {
      const promoResult =
        await this.promoService.validatePromo(
          promoCode,
          subtotal,
        );

      if (
        !promoResult.valid ||
        !promoResult.promo
      ) {
        throw new Error(
          promoResult.message,
        );
      }

      const promo = promoResult.promo;

      discount =
        this.promoService.calculateDiscount(
          promo,
          subtotal,
        );

      promoId = promo.id;
    }

    const total =
      subtotal +
      shippingCost -
      discount;

    const orderNumber =
      `NT-${Date.now()}`;

    const order =
      await this.prisma.$transaction(
        async (tx) => {
          /*
           * 1. Create Order
           * 2. Create OrderItem
           * 3. Create Fulfillment PENDING
           */
          const createdOrder =
            await tx.order.create({
              data: {
                orderNumber,
                status: 'PENDING',
                subtotal,
                shippingCost,
                discount,
                total,
                customerId,
                promoId,

                items: {
                  create: cart.items.map(
                    (item) => ({
                      productId:
                        item.productId,

                      quantity:
                        item.quantity,

                      unitPrice:
                        item.product.price,

                      subtotal:
                        Number(
                          item.product.price,
                        ) *
                        item.quantity,

                      fulfillment: {
                        create: {
                          status: 'PENDING',
                        },
                      },
                    }),
                  ),
                },
              },

              include: {
                items: {
                  include: {
                    product: true,
                    fulfillment: true,
                  },
                },
              },
            });

          /*
           * Reserve stock.
           *
           * Semua product tetap memakai stock
           * sesuai keputusan kita.
           */
          for (const item of cart.items) {
            const updatedStock =
              await tx.product.updateMany({
                where: {
                  id: item.productId,
                  stock: {
                    gte: item.quantity,
                  },
                },

                data: {
                  stock: {
                    decrement: item.quantity,
                  },
                },
              });

            if (updatedStock.count !== 1) {
              throw new Error(
                `Stok "${item.product.name}" tidak mencukupi.`,
              );
            }
          }

          /*
           * Cart hanya dihapus setelah order
           * dan fulfillment berhasil dibuat.
           */
          await tx.cartItem.deleteMany({
            where: {
              cartId: cart.id,
            },
          });

          return createdOrder;
        },
      );

    /*
     * Payment dibuat setelah transaction Order selesai.
     */
    const payment =
      await this.paymentService.createPendingPayment(
        order.id,
        paymentMethod,
      );

    return {
      ...order,
      payment,
    };
  }

  async findByCustomerId(
    customerId: string,
  ) {
    return this.prisma.order.findMany({
      where: {
        customerId,
      },

      orderBy: {
        createdAt: 'desc',
      },

      include: {
        items: {
          include: {
            product: true,
            fulfillment: true,
          },
        },

        payment: true,
      },
    });
  }

  async confirmOrder(
    orderId: string,
  ) {
    const order =
      await this.prisma.order.findUnique({
        where: {
          id: orderId,
        },
      });

    if (!order) {
      throw new Error(
        'Pesanan tidak ditemukan.',
      );
    }

    if (order.status === 'CONFIRMED') {
      return order;
    }

    if (order.status === 'CANCELLED') {
      throw new ConflictException(
        'Pesanan yang dibatalkan tidak dapat dikonfirmasi.',
      );
    }

    if (order.status !== 'PENDING') {
      throw new ConflictException(
        `Pesanan dengan status ${order.status} tidak dapat dikonfirmasi.`,
      );
    }

    return this.prisma.order.update({
      where: {
        id: orderId,
      },

      data: {
        status: 'CONFIRMED',
      },
    });
  }

  async processOrder(
    orderId: string,
  ) {
    const order =
      await this.prisma.order.findUnique({
        where: {
          id: orderId,
        },
      });

    if (!order) {
      throw new Error(
        'Pesanan tidak ditemukan.',
      );
    }

    if (order.status === 'PROCESSING') {
      return order;
    }

    if (order.status !== 'CONFIRMED') {
      throw new ConflictException(
        `Pesanan dengan status ${order.status} tidak dapat diproses.`,
      );
    }

    return this.prisma.order.update({
      where: {
        id: orderId,
      },

      data: {
        status: 'PROCESSING',
      },
    });
  }

  async shipOrder(
    orderId: string,
  ) {
    const order =
      await this.prisma.order.findUnique({
        where: {
          id: orderId,
        },
      });

    if (!order) {
      throw new Error(
        'Pesanan tidak ditemukan.',
      );
    }

    if (order.status === 'SHIPPED') {
      return order;
    }

    if (order.status !== 'PROCESSING') {
      throw new ConflictException(
        `Pesanan dengan status ${order.status} tidak dapat dikirim.`,
      );
    }

    return this.prisma.order.update({
      where: {
        id: orderId,
      },

      data: {
        status: 'SHIPPED',
      },
    });
  }

  async deliverOrder(
    orderId: string,
  ) {
    const order =
      await this.prisma.order.findUnique({
        where: {
          id: orderId,
        },
      });

    if (!order) {
      throw new Error(
        'Pesanan tidak ditemukan.',
      );
    }

    if (order.status === 'DELIVERED') {
      return order;
    }

    if (order.status !== 'SHIPPED') {
      throw new ConflictException(
        `Pesanan dengan status ${order.status} tidak dapat ditandai sebagai delivered.`,
      );
    }

    return this.prisma.order.update({
      where: {
        id: orderId,
      },

      data: {
        status: 'DELIVERED',
      },
    });
  }

  async cancelOrder(
    orderId: string,
  ) {
    const order =
      await this.prisma.order.findUnique({
        where: {
          id: orderId,
        },

        include: {
          items: true,
        },
      });

    if (!order) {
      throw new Error(
        'Pesanan tidak ditemukan.',
      );
    }

    if (order.status === 'CANCELLED') {
      throw new ConflictException(
        'Pesanan yang dibatalkan tidak dapat dikonfirmasi.',
      );
    }

    if (order.status === 'SHIPPED') {
      throw new ConflictException(
        'Pesanan yang sudah dikirim tidak dapat dibatalkan.',
      );
    }

    if (order.status === 'DELIVERED') {
      throw new ConflictException(
        'Pesanan yang sudah diterima tidak dapat dibatalkan.',
      );
    }

    const cancelledOrder =
      await this.prisma.$transaction(
        async (tx) => {
          /*
           * Restore stock.
           */
          for (const item of order.items) {
            await tx.product.update({
              where: {
                id: item.productId,
              },

              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }

          /*
           * Cancel seluruh fulfillment
           * yang masih terkait order items.
           */
          await tx.fulfillment.updateMany({
            where: {
              orderItemId: {
                in: order.items.map(
                  (item) => item.id,
                ),
              },

              status: {
                not: 'DELIVERED',
              },
            },

            data: {
              status: 'CANCELLED',
            },
          });

          return tx.order.update({
            where: {
              id: orderId,
            },

            data: {
              status: 'CANCELLED',
            },
          });
        },
      );

    return cancelledOrder;
  }

  async cancelOrderFromPayment(
    orderId: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const order =
          await tx.order.findUnique({
            where: {
              id: orderId,
            },

            include: {
              items: true,
            },
          });

        if (!order) {
          throw new Error(
            'Pesanan tidak ditemukan.',
          );
        }

        if (
          order.status ===
          'CANCELLED'
        ) {
          return order;
        }

        if (
          order.status ===
            'SHIPPED' ||
          order.status ===
            'DELIVERED'
        ) {
          throw new ConflictException(
            'Pesanan yang sudah dikirim atau diterima tidak dapat dibatalkan otomatis.',
          );
        }

        if (order.status !== 'PENDING') {
          return order;
        }

        /*
         * Atomic PENDING -> CANCELLED
         */
        const cancelled =
          await tx.order.updateMany({
            where: {
              id: orderId,
              status: 'PENDING',
            },

            data: {
              status: 'CANCELLED',
            },
          });

        /*
         * Kalau transaksi lain sudah
         * mengubah status order, jangan
         * restore stock dua kali.
         */
        if (cancelled.count === 0) {
          const latestOrder =
            await tx.order.findUnique({
              where: {
                id: orderId,
              },

              include: {
                items: true,
              },
            });

          if (!latestOrder) {
            throw new Error(
              'Pesanan tidak ditemukan.',
            );
          }

          return latestOrder;
        }

        /*
         * Restore stock hanya ketika
         * PENDING -> CANCELLED benar-benar
         * terjadi di transaction ini.
         */
        for (const item of order.items) {
          await tx.product.update({
            where: {
              id: item.productId,
            },

            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }

        /*
         * Cancel fulfillment yang belum
         * delivered.
         */
        await tx.fulfillment.updateMany({
          where: {
            orderItemId: {
              in: order.items.map(
                (item) => item.id,
              ),
            },

            status: {
              not: 'DELIVERED',
            },
          },

          data: {
            status: 'CANCELLED',
          },
        });

        return tx.order.findUnique({
          where: {
            id: orderId,
          },

          include: {
            items: {
              include: {
                fulfillment: true,
              },
            },
          },
        });
      },
    );
  }

  async findAllForAdmin() {
    return this.prisma.order.findMany({
      orderBy: {
        createdAt: 'desc',
      },

      include: {
        customer: true,

        items: {
          include: {
            product: true,
            fulfillment: true,
          },
        },

        payment: true,
      },
    });
  }

  async findByIdForAdmin(
    orderId: string,
  ) {
    const order =
      await this.prisma.order.findUnique({
        where: {
          id: orderId,
        },

        include: {
          customer: true,

          items: {
            include: {
              product: true,
              fulfillment: true,
            },
          },

          payment: true,
        },
      });

    if (!order) {
      throw new Error(
        'Pesanan tidak ditemukan.',
      );
    }

    return order;
  }

async findWaitingSupplierOrders() {
  const orders = await this.prisma.order.findMany({
    orderBy: {
      createdAt: 'asc',
    },

    include: {
      customer: true,
      payment: true,

      items: {
        include: {
          fulfillment: true,

          product: {
            include: {
              supplierProduct: true,
            },
          },
        },
      },
    },
  });

  return orders
    .filter(
      (order) =>
        order.payment?.status === 'PAID',
    )
    .map((order) => ({
      ...order,

      items: order.items.filter(
        (item) =>
          item.fulfillment?.status ===
            'WAITING_SUPPLIER' &&
          !!item.product.supplierProduct,
      ),
    }))
    .filter(
      (order) => order.items.length > 0,
    );
}

async completeSupplierFulfillment(
  orderId: string,
) {
  return this.prisma.$transaction(
    async (tx) => {
      const order =
        await tx.order.findUnique({
          where: {
            id: orderId,
          },
          include: {
            payment: true,
            customer: true,
            items: {
              include: {
                fulfillment: true,
                product: {
                  include: {
                    supplierProduct: true,
                  },
                },
              },
            },
          },
        });

      if (!order) {
        throw new Error(
          'Pesanan tidak ditemukan.',
        );
      }

      if (!order.payment) {
        throw new ConflictException(
          'Payment tidak ditemukan.',
        );
      }

      if (
        order.payment.status !== 'PAID'
      ) {
        throw new ConflictException(
          'Pesanan belum berstatus PAID.',
        );
      }

      const supplierItems =
        order.items.filter(
          (item) =>
            item.product.supplierProduct &&
            item.fulfillment?.status ===
              'WAITING_SUPPLIER',
        );

      if (supplierItems.length === 0) {
        const alreadyDelivered =
          order.items.some(
            (item) =>
              item.fulfillment?.status ===
              'DELIVERED',
          );

        if (alreadyDelivered) {
          return {
            ok: true,
            idempotent: true,
            order,
            orderCompleted:
              order.status === 'DELIVERED',
          };
        }

        throw new ConflictException(
          'Tidak ada fulfillment supplier yang menunggu untuk dikirim.',
        );
      }

      /**
       * MVP reseller:
       * satu action admin menyelesaikan
       * fulfillment supplier yang pending.
       */
      for (const item of supplierItems) {
        const updated =
          await tx.fulfillment.updateMany({
            where: {
              id: item.fulfillment!.id,
              status: 'WAITING_SUPPLIER',
            },
            data: {
              status: 'DELIVERED',
              deliveredAt: new Date(),
            },
          });

        if (updated.count !== 1) {
          throw new ConflictException(
            'Fulfillment supplier gagal diperbarui.',
          );
        }
      }

      /**
       * Order baru boleh menjadi DELIVERED
       * kalau SEMUA item sudah DELIVERED.
       */
      const refreshedOrder =
        await tx.order.findUnique({
          where: {
            id: order.id,
          },
          include: {
            customer: true,
            payment: true,
            items: {
              include: {
                fulfillment: true,
              },
            },
          },
        });

      if (!refreshedOrder) {
        throw new Error(
          'Order gagal dimuat ulang.',
        );
      }

      const allDelivered =
        refreshedOrder.items.length > 0 &&
        refreshedOrder.items.every(
          (item) =>
            item.fulfillment?.status ===
            'DELIVERED',
        );

      let finalOrder =
        refreshedOrder;

      if (allDelivered) {
        await tx.order.updateMany({
          where: {
            id: order.id,
            status: {
              not: 'DELIVERED',
            },
          },
          data: {
            status: 'DELIVERED',
          },
        });

        finalOrder =
          (await tx.order.findUnique({
            where: {
              id: order.id,
            },
            include: {
              customer: true,
              payment: true,
              items: {
                include: {
                  fulfillment: true,
                },
              },
            },
          })) ?? refreshedOrder;
      }

      return {
        ok: true,
        idempotent: false,
        order: finalOrder,
        orderCompleted: allDelivered,
      };
    },
  );
}

}