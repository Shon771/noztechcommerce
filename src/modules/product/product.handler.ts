import { Injectable } from '@nestjs/common';
import { ProductService } from './product.service';

interface ProductCatalogButton {
  text: string;
  callback_data: string;
}

export interface ProductCatalogResponse {
  text: string;
  inlineKeyboard: ProductCatalogButton[][];
  products: {
    id: string;
    name: string;
    price: number;
    stock: number;
    photoFileId?: string;
  }[];
  page: number;
  totalPages: number;
  logoFileId?: string;
}

export interface ProductDetailResponse {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  photoFileId?: string;
}

const PAGE_SIZE = 10;

@Injectable()
export class ProductHandler {
  constructor(
    private readonly productService: ProductService,
  ) {}

  async handle(
    chatId: number,
    requestedPage = 1,
  ): Promise<ProductCatalogResponse> {
    void chatId;

    const products =
      await this.productService.findAll();

    const totalPages = Math.max(
      1,
      Math.ceil(
        products.length / PAGE_SIZE,
      ),
    );

    const page = Math.min(
      Math.max(1, requestedPage),
      totalPages,
    );

    const startIndex =
      (page - 1) * PAGE_SIZE;

    const pageProducts = products.slice(
      startIndex,
      startIndex + PAGE_SIZE,
    );

    if (products.length === 0) {
     return {
  text:
    'Assalamu\'alaikum Warahmatullahi Wabarakatuh 🤝\n\n' +
    '👋 Selamat datang di NozTech Commerce.\n\n' +
    '🛒 KATALOG PRODUK\n\n' +
    'Belum ada produk yang tersedia.',
  inlineKeyboard: [
    [
      {
        text: '🔙 Kembali ke Menu',
        callback_data: 'menu:main',
      },
    ],
  ],
  products: [],
  page: 1,
  totalPages: 1,
  ...(process.env.TELEGRAM_CATALOG_LOGO_FILE_ID
  ? {
      logoFileId:
        process.env.TELEGRAM_CATALOG_LOGO_FILE_ID,
    }
  : {}),
};
    }

    const lines: string[] = [
      'Assalamu\'alaikum Warahmatullahi Wabarakatuh 🤝',
      '',
      '👋 Selamat datang di NozTech Commerce!',
      '🛍️ Temukan berbagai produk digital pilihan.',
      '💳 Belanja mudah, cepat, dan praktis melalui Telegram.',
      '',
      '━━━━━━━━━━━━━━━━━━',
      '🛒 KATALOG PRODUK',
      '━━━━━━━━━━━━━━━━━━',
      '',
    ];

    const inlineKeyboard:
      ProductCatalogButton[][] = [];

    const catalogProducts:
      ProductCatalogResponse['products'] = [];

      const productButtonRow: ProductCatalogButton[] = [];

    pageProducts.forEach(
      (product, index) => {
        const displayNumber =
          startIndex + index + 1;

        const price =
          Number(product.price);

        const stockText =
          product.stock > 0
            ? `🟢 ${product.stock} tersedia`
            : '🔴 Habis';

        const photoFileId =
          product.images[0]?.url;

        catalogProducts.push({
          id: product.id,
          name: product.name,
          price,
          stock: product.stock,
          ...(photoFileId
            ? { photoFileId }
            : {}),
        });

       lines.push(
  `[${displayNumber}] ${product.name}`,
);

       productButtonRow.push({
  text: `[${displayNumber}]`,
  callback_data: `catalog:product:${product.id}:${page}`,
});

      },
    );

    inlineKeyboard.push(productButtonRow);

    lines.push(
      '━━━━━━━━━━━━━━━━━━',
      `📄 Halaman ${page} / ${totalPages}`,
    );

    /*
     * Pagination
     */
    const paginationRow:
      ProductCatalogButton[] = [];

    if (page > 1) {
      paginationRow.push({
        text: '◀️ Sebelumnya',
        callback_data:
          `catalog:page:${page - 1}`,
      });
    }

    if (page < totalPages) {
      paginationRow.push({
        text: 'Berikutnya ▶️',
        callback_data:
          `catalog:page:${page + 1}`,
      });
    }

    if (paginationRow.length > 0) {
      inlineKeyboard.push(
        paginationRow,
      );
    }

    /*
     * Footer
     */
    lines.push(
      '',
      '👤 Admin:',
      process.env.TELEGRAM_ADMIN_USERNAME ??
        'Silakan hubungi admin',
      '',
      '🤖 Bot:',
      `@${process.env.TELEGRAM_BOT_USERNAME ?? 'NozTechStoreBot'}`,
      '',
      '💬 Butuh bantuan? Hubungi admin kami.',
    );

    return {
  text: lines.join('\n'),
  inlineKeyboard,
  products: catalogProducts,
  page,
  totalPages,
 ...(process.env.TELEGRAM_CATALOG_LOGO_FILE_ID
  ? {
      logoFileId:
        process.env.TELEGRAM_CATALOG_LOGO_FILE_ID,
    }
  : {}),
};
  }

  async getDetail(
    productId: string,
  ): Promise<ProductDetailResponse | null> {
    const product =
      await this.productService.findById(
        productId,
      );

    if (!product) {
      return null;
    }

    const photoFileId =
      product.images[0]?.url;

    return {
      id: product.id,
      name: product.name,
      description:
        product.description ?? '',
      price: Number(product.price),
      stock: product.stock,
      ...(photoFileId
        ? { photoFileId }
        : {}),
    };
  }
}