import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll() {
    try {
      return await this.prisma.product.findMany({
        include: {
          images: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
        },
      });
    } catch (error) {
      console.error(
        '=== PRODUCT FIND ALL ERROR ===',
      );
      console.error(error);

      console.error('=== ERROR CODE ===');
      console.error(
        error &&
        typeof error === 'object' &&
        'code' in error
          ? error.code
          : 'NO_CODE',
      );

      console.error('=== ERROR META ===');
      console.error(
        error &&
        typeof error === 'object' &&
        'meta' in error
          ? error.meta
          : 'NO_META',
      );

      throw error;
    }
  }

  async findActiveCategories() {
    return this.prisma.category.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async createProduct(data: {
    name: string;
    price: number;
    description: string;
    photoFileId: string;
    categoryId: string;
    stock: number;
  }) {
    const slugBase = data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const slug = `${slugBase}-${Date.now()}`;
    const sku = `NTC-${Date.now()}`;

    return this.prisma.product.create({
      data: {
        sku,
        name: data.name,
        slug,
        description: data.description,
        price: data.price,
        stock: data.stock,
        status: 'ACTIVE',
        categoryId: data.categoryId,
        images: {
          create: {
            url: data.photoFileId,
            altText: data.name,
            sortOrder: 0,
            isPrimary: true,
          },
        },
      },
      include: {
        category: true,
        images: true,
      },
    });
  }

    async updateProduct(
    id: string,
    data: {
      name?: string;
      price?: number;
      description?: string;
      categoryId?: string;
      stock?: number;
    },
  ) {
    return this.prisma.product.update({
      where: {
        id,
      },
      data: {
        ...(data.name !== undefined
          ? { name: data.name }
          : {}),
        ...(data.price !== undefined
          ? { price: data.price }
          : {}),
        ...(data.description !== undefined
          ? {
              description:
                data.description,
            }
          : {}),
        ...(data.categoryId !== undefined
          ? {
              categoryId:
                data.categoryId,
            }
          : {}),
        ...(data.stock !== undefined
          ? { stock: data.stock }
          : {}),
      },
      include: {
        category: true,
        images: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });
  }

 async archiveProduct(
  id: string,
) {
  return this.prisma.product.update({
    where: {
      id,
    },
    data: {
      status: 'ARCHIVED',
    },
    include: {
      category: true,
      images: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  });
}

  async findById(id: string) {
    return this.prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        category: true,
        images: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.product.findUnique({
      where: {
        slug,
      },
      include: {
        category: true,
        images: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });
  }
}