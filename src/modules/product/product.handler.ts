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
}

@Injectable()
export class ProductHandler {
  constructor(
    private readonly productService: ProductService,
  ) {}

  async handle(
    chatId: number,
  ): Promise<ProductCatalogResponse> {
    const products =
      await this.productService.findAll();

    if (products.length === 0) {
      return {
        text:
          '🛒 Katalog Produk\n\n' +
          'Belum ada produk yang tersedia.',
        inlineKeyboard: [],
        products: [],
      };
    }

    const lines = [
      '🛒 KATALOG PRODUK',
      '',
    ];

    const inlineKeyboard: ProductCatalogButton[][] =
      [];

    const catalogProducts: ProductCatalogResponse['products'] =
      [];

    for (const product of products) {
      const price = Number(
        product.price,
      ).toLocaleString('id-ID');

      catalogProducts.push({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        stock: product.stock,
        ...(product.images[0]?.url
  ? {
      photoFileId:
        product.images[0].url,
    }
  : {}),
      });

      lines.push(
        `📦 ${product.name}`,
        `💰 Rp${price}`,
        `📊 Stok: ${product.stock}`,
        '',
      );

      inlineKeyboard.push([
        {
          text: '🛒 Tambah ke Keranjang',
          callback_data: `cart:add:${product.id}`,
        },
      ]);
    }

    return {
      text: lines.join('\n').trim(),
      inlineKeyboard,
      products: catalogProducts,
    };
  }
}