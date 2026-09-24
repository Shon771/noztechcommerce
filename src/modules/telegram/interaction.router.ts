import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StartHandler } from './handlers/start.handler';
import { TelegramService } from './telegram.service';
import { CallbackRouter } from './callback.router';
import { CheckoutStateService } from './checkout-state.service';
import { PromoService } from '../promo/promo.service';
import { CustomerService } from '../customer/customer.service';
import { CartService } from '../cart/cart.service';
import { AdminProductStateService } from './admin-product-state.service';
import { AdminHandler } from './handlers/admin.handler';
import { ProductService } from '../product/product.service';

@Injectable()
export class InteractionRouter {
  private readonly logger = new Logger(
    InteractionRouter.name,
  );

  constructor(
    private readonly startHandler: StartHandler,
    private readonly telegramService: TelegramService,
    private readonly callbackRouter: CallbackRouter,
    private readonly checkoutStateService: CheckoutStateService,
    private readonly promoService: PromoService,
    private readonly customerService: CustomerService,
    private readonly cartService: CartService,
    private readonly configService: ConfigService,
    private readonly adminProductStateService: AdminProductStateService,
    private readonly adminHandler: AdminHandler,
    private readonly productService: ProductService,
  ) {}

  private isAdmin(
    telegramUserId: number,
  ): boolean {
    const adminIds =
      this.configService
        .get<string>('TELEGRAM_ADMIN_IDS')
        ?.split(',')
        .map((id) => id.trim())
        .filter(Boolean) ?? [];

    return adminIds.includes(
      String(telegramUserId),
    );
  }

  async route(update: {
    update_id: number;

    message?: {
      message_id: number;
      text?: string;
      caption?: string;
      photo?: {
        file_id: string;
        file_unique_id: string;
        width: number;
        height: number;
        file_size?: number;
      }[];
      chat: {
        id: number;
        type: string;
      };
      from?: {
        id: number;
        first_name?: string;
        username?: string;
      };
    };

    callback_query?: {
      id: string;
      data?: string;
      from: {
        id: number;
        first_name?: string;
        username?: string;
      };
      message?: {
        message_id: number;
        chat: {
          id: number;
          type: string;
        };
      };
    };
  }): Promise<void> {
    /*
     * Handle Telegram callback query first.
     */
    if (update.callback_query) {
      await this.callbackRouter.route(
        update.callback_query,
      );

      return;
    }

    /*
     * Handle normal Telegram message.
     */
    const message = update.message;

    if (!message) {
      return;
    }

    const text =
      message.text?.trim() ?? '';

    const telegramUserId = String(
      message.from?.id ?? '',
    );

    /*
     * Admin product state.
     */
    const adminProductState =
      this.adminProductStateService.get(
        telegramUserId,
      );

      /*
 * Admin command harus selalu diprioritaskan.
 * Jangan biarkan admin product state
 * menangkap /admin sebagai input.
 */
if (
  text === '/admin' ||
  text.startsWith('/admin@')
) {
  const telegramUserIdNumber =
    message.from?.id;

  if (
    !telegramUserIdNumber ||
    !this.isAdmin(
      telegramUserIdNumber,
    )
  ) {
    await this.telegramService.sendMessage(
      message.chat.id,
      '⛔ Akses ditolak.\n\n' +
        'Kamu bukan admin.',
    );

    return;
  }

  // Bersihkan state percakapan produk
  this.adminProductStateService.clear(
    telegramUserId,
  );

  await this.adminHandler.show(
    message.chat.id,
  );

  return;
}

    /*
     * Handle admin product conversation.
     */
    if (
      adminProductState &&
      message.from?.id &&
      this.isAdmin(message.from.id)
    ) {
      /*
       * Product name
       */

if (
  adminProductState.step === 'edit-name'
) {
  if (!text) {
    await this.telegramService.sendMessage(
      message.chat.id,
      '⚠️ Nama produk tidak boleh kosong.\n\n' +
        'Silakan masukkan nama produk baru:',
    );

    return;
  }

  const productId =
    adminProductState.productId;

    this.logger.warn(
  `EDIT NAME DEBUG | productId=${JSON.stringify(productId)} | state=${JSON.stringify(adminProductState)}`,
);

  if (!productId) {
    this.adminProductStateService.clear(
      telegramUserId,
    );

    await this.telegramService.sendMessage(
      message.chat.id,
      '❌ ID produk tidak ditemukan.\n\n' +
        'Silakan buka menu admin lagi.',
      [
        [
          {
            text: '🔐 Admin Panel',
            callback_data: 'admin:open',
          },
        ],
      ],
    );

    return;
  }

  const updatedProduct =
    await this.productService.updateProduct(
      productId,
      {
        name: text,
      },
    );

  this.adminProductStateService.clear(
    telegramUserId,
  );

  await this.telegramService.sendMessage(
    message.chat.id,
    '✅ NAMA PRODUK BERHASIL DIUBAH\n\n' +
      `📦 ${updatedProduct.name}`,
    [
      [
        {
          text: '✏️ Edit Produk',
          callback_data:
            `admin:product:edit:${updatedProduct.id}`,
        },
      ],
      [
        {
          text: '📦 Daftar Produk',
          callback_data:
            'admin:product:list',
        },
      ],
    ],
  );

  return;
}

if (
  adminProductState.step === 'edit-description'
) {
  if (!text) {
    await this.telegramService.sendMessage(
      message.chat.id,
      '⚠️ Deskripsi tidak boleh kosong.\n\n' +
        'Silakan masukkan deskripsi baru:',
    );

    return;
  }

  const productId =
    adminProductState.productId;

  if (!productId) {
    this.adminProductStateService.clear(
      telegramUserId,
    );

    await this.telegramService.sendMessage(
      message.chat.id,
      '❌ ID produk tidak ditemukan.\n\n' +
        'Silakan buka menu admin lagi.',
      [
        [
          {
            text: '🔐 Admin Panel',
            callback_data: 'admin:open',
          },
        ],
      ],
    );

    return;
  }

  const updatedProduct =
    await this.productService.updateProduct(
      productId,
      {
        description: text,
      },
    );

  this.adminProductStateService.clear(
    telegramUserId,
  );

  await this.telegramService.sendMessage(
    message.chat.id,
    '✅ DESKRIPSI PRODUK BERHASIL DIUBAH\n\n' +
      `📦 ${updatedProduct.name}\n\n` +
      `📝 ${updatedProduct.description ?? '-'}`,
    [
      [
        {
          text: '✏️ Edit Produk',
          callback_data:
            `admin:product:edit:${updatedProduct.id}`,
        },
      ],
      [
        {
          text: '📦 Daftar Produk',
          callback_data:
            'admin:product:list',
        },
      ],
    ],
  );

  return;
}

if (
  adminProductState.step === 'edit-stock'
) {
  if (!text) {
    await this.telegramService.sendMessage(
      message.chat.id,
      '⚠️ Stok tidak boleh kosong.\n\n' +
        'Silakan masukkan jumlah stok baru.\n' +
        'Contoh: 10',
    );

    return;
  }

  const stock = Number(text);

  if (
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    await this.telegramService.sendMessage(
      message.chat.id,
      '⚠️ Stok tidak valid.\n\n' +
        'Masukkan angka bulat 0 atau lebih.\n' +
        'Contoh: 10',
    );

    return;
  }

  const productId =
    adminProductState.productId;

  if (!productId) {
    this.adminProductStateService.clear(
      telegramUserId,
    );

    await this.telegramService.sendMessage(
      message.chat.id,
      '❌ ID produk tidak ditemukan.\n\n' +
        'Silakan buka menu admin lagi.',
      [
        [
          {
            text: '🔐 Admin Panel',
            callback_data: 'admin:open',
          },
        ],
      ],
    );

    return;
  }

  const updatedProduct =
    await this.productService.updateProduct(
      productId,
      {
        stock,
      },
    );

  this.adminProductStateService.clear(
    telegramUserId,
  );

  await this.telegramService.sendMessage(
    message.chat.id,
    '✅ STOK PRODUK BERHASIL DIUBAH\n\n' +
      `📦 ${updatedProduct.name}\n` +
      `📊 Stok: ${updatedProduct.stock}`,
    [
      [
        {
          text: '✏️ Edit Produk',
          callback_data:
            `admin:product:edit:${updatedProduct.id}`,
        },
      ],
      [
        {
          text: '📦 Daftar Produk',
          callback_data:
            'admin:product:list',
        },
      ],
    ],
  );

  return;
}

if (
  adminProductState.step === 'edit-price'
) {
  if (!text) {
    await this.telegramService.sendMessage(
      message.chat.id,
      '⚠️ Harga tidak boleh kosong.\n\n' +
        'Silakan masukkan harga baru.\n' +
        'Contoh: 25000',
    );

    return;
  }

  const price = Number(text);

  if (
    !Number.isFinite(price) ||
    price <= 0
  ) {
    await this.telegramService.sendMessage(
      message.chat.id,
      '⚠️ Harga tidak valid.\n\n' +
        'Masukkan angka lebih dari 0.\n' +
        'Contoh: 25000',
    );

    return;
  }

  const productId =
    adminProductState.productId;

  if (!productId) {
    this.adminProductStateService.clear(
      telegramUserId,
    );

    await this.telegramService.sendMessage(
      message.chat.id,
      '❌ ID produk tidak ditemukan.\n\n' +
        'Silakan buka menu admin lagi.',
      [
        [
          {
            text: '🔐 Admin Panel',
            callback_data: 'admin:open',
          },
        ],
      ],
    );

    return;
  }

  const updatedProduct =
    await this.productService.updateProduct(
      productId,
      {
        price,
      },
    );

  this.adminProductStateService.clear(
    telegramUserId,
  );

  await this.telegramService.sendMessage(
    message.chat.id,
    '✅ HARGA PRODUK BERHASIL DIUBAH\n\n' +
      `📦 ${updatedProduct.name}\n` +
      `💰 Rp${Number(
        updatedProduct.price,
      ).toLocaleString('id-ID')}`,
    [
      [
        {
          text: '✏️ Edit Produk',
          callback_data:
            `admin:product:edit:${updatedProduct.id}`,
        },
      ],
      [
        {
          text: '📦 Daftar Produk',
          callback_data:
            'admin:product:list',
        },
      ],
    ],
  );

  return;
}



      if (
        adminProductState.step === 'name'
      ) {
        if (!text) {
          await this.telegramService.sendMessage(
            message.chat.id,
            '⚠️ Nama produk tidak boleh kosong.\n\n' +
              'Silakan masukkan nama produk:',
          );

          return;
        }

        this.adminProductStateService.set(
          telegramUserId,
          {
            ...adminProductState,
            step: 'price',
            name: text,
          },
        );

        await this.telegramService.sendMessage(
          message.chat.id,
          '💰 Masukkan harga jual:\n\n' +
            'Contoh: 15000',
        );

        return;
      }

      /*
       * Product price
       */

if (
        adminProductState.step === 'price'
      ) {
        if (!text) {
          await this.telegramService.sendMessage(
            message.chat.id,
            '⚠️ Harga tidak boleh kosong.\n\n' +
              'Masukkan angka.\n' +
              'Contoh: 15000',
          );

          return;
        }

        const price = Number(text);

        if (
          !Number.isFinite(price) ||
          price <= 0
        ) {
          await this.telegramService.sendMessage(
            message.chat.id,
            '⚠️ Harga tidak valid.\n\n' +
              'Masukkan angka lebih dari 0.\n' +
              'Contoh: 15000',
          );

          return;
        }

        this.adminProductStateService.set(
          telegramUserId,
          {
            ...adminProductState,
            step: 'description',
            price,
          },
        );

        await this.telegramService.sendMessage(
          message.chat.id,
          '📝 Masukkan deskripsi produk:',
        );

        return;
      }

      /*
       * Product description
       */
      if (
        adminProductState.step ===
        'description'
      ) {
        if (!text) {
          await this.telegramService.sendMessage(
            message.chat.id,
            '⚠️ Deskripsi tidak boleh kosong.\n\n' +
              'Silakan masukkan deskripsi produk:',
          );

          return;
        }

        this.adminProductStateService.set(
          telegramUserId,
          {
            ...adminProductState,
            step: 'photo',
            description: text,
          },
        );

        await this.telegramService.sendMessage(
          message.chat.id,
          '🖼️ Kirim foto produk sekarang.',
        );

        return;
      }

      /*
       * Product photo
       */
      if (
        adminProductState.step === 'photo'
      ) {
        const photos = message.photo;

        if (
          !photos ||
          photos.length === 0
        ) {
          await this.telegramService.sendMessage(
            message.chat.id,
            '⚠️ Foto tidak ditemukan.\n\n' +
              'Silakan kirim foto produk.',
          );

          return;
        }

        const largestPhoto =
          photos[photos.length - 1];

        if (!largestPhoto) {
          await this.telegramService.sendMessage(
            message.chat.id,
            '⚠️ Foto tidak valid.\n\n' +
              'Silakan kirim foto produk lagi.',
          );

          return;
        }

        this.adminProductStateService.set(
          telegramUserId,
          {
            ...adminProductState,
            step: 'category',
            photoFileId:
              largestPhoto.file_id,
          },
        );

        const categories =
  await this.productService.findActiveCategories();

if (categories.length === 0) {
  await this.telegramService.sendMessage(
    message.chat.id,
    '⚠️ Belum ada kategori produk.\n\n' +
      'Tambahkan kategori terlebih dahulu.',
  );

  this.adminProductStateService.clear(
    telegramUserId,
  );

  return;
}

const categoryKeyboard = categories.map(
  (category) => [
    {
      text: `📂 ${category.name}`,
      callback_data:
        `admin:product:category:${category.id}`,
    },
  ],
);

await this.telegramService.sendMessage(
  message.chat.id,
  '📂 PILIH KATEGORI PRODUK\n\n' +
    'Silakan pilih kategori:',
  categoryKeyboard,
);

        return;
      }
    }

    /*
 * Product stock
 */
if (
  adminProductState?.step === 'stock' &&
  message.from?.id &&
  this.isAdmin(message.from.id)
) {
  if (!text) {
    await this.telegramService.sendMessage(
      message.chat.id,
      '⚠️ Stok tidak boleh kosong.\n\n' +
        'Masukkan jumlah stok.\n' +
        'Contoh: 10',
    );

    return;
  }

  const stock = Number(text);

  if (
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    await this.telegramService.sendMessage(
      message.chat.id,
      '⚠️ Stok tidak valid.\n\n' +
        'Masukkan angka bulat 0 atau lebih.\n' +
        'Contoh: 10',
    );

    return;
  }

  this.adminProductStateService.set(
    telegramUserId,
    {
      ...adminProductState,
      step: 'confirm',
      stock,
    },
  );

  await this.telegramService.sendMessage(
    message.chat.id,
    '✅ DATA PRODUK\n\n' +
      `📦 Nama: ${adminProductState.name}\n` +
      `💰 Harga: Rp${Number(
        adminProductState.price,
      ).toLocaleString('id-ID')}\n` +
      `📝 Deskripsi: ${adminProductState.description}\n` +
      `🖼️ Foto: ${
        adminProductState.photoFileId
          ? 'Sudah diterima'
          : 'Tidak ada'
      }\n` +
      `📂 Kategori: ${
        adminProductState.categoryId
          ? 'Sudah dipilih'
          : '-'
      }\n` +
      `📊 Stok: ${stock}\n\n` +
      'Periksa data produk sebelum disimpan.',
    [
      [
        {
          text: '✅ Simpan Produk',
          callback_data:
            'admin:product:confirm',
        },
      ],
      [
        {
          text: '❌ Batal',
          callback_data:
            'admin:product:cancel',
        },
      ],
    ],
  );

  return;
}

    /*
     * Start command.
     */
    if (
      text === '/start' ||
      text.startsWith('/start@')
    ) {
      await this.startHandler.handle(
        message.chat.id,
        message.from?.first_name,
      );

      return;
    }

    /*
     * Checkout / promo state.
     */
    const checkoutState =
      this.checkoutStateService.getState(
        telegramUserId,
      );

    if (
      checkoutState?.waitingForPromo
    ) {
      const customer =
        await this.customerService.findOrCreateByTelegram(
          String(message.from?.id),
          message.from?.first_name,
          message.from?.username,
        );

      const cart =
        await this.cartService.getCart(
          customer.id,
        );

      if (
        !cart ||
        cart.items.length === 0
      ) {
        await this.telegramService.sendMessage(
          message.chat.id,
          '🛒 Keranjang kamu masih kosong.',
        );

        this.checkoutStateService.clear(
          telegramUserId,
        );

        return;
      }

      let subtotal = 0;

      for (const item of cart.items) {
        subtotal +=
          Number(item.product.price) *
          item.quantity;
      }

      const promoCode =
        text.toUpperCase();

      const promo =
        await this.promoService.validatePromo(
          promoCode,
          subtotal,
        );

      if (
        !promo.valid ||
        !promo.promo
      ) {
        await this.telegramService.sendMessage(
          message.chat.id,
          `❌ ${promo.message}\n\n` +
            'Silakan masukkan kode promo lain.',
        );

        return;
      }

      const discount =
        this.promoService.calculateDiscount(
          promo.promo,
          subtotal,
        );

      this.checkoutStateService.setPromoCode(
        telegramUserId,
        promoCode,
      );

      await this.telegramService.sendMessage(
        message.chat.id,
        `🎟️ PROMO VALID\n\n` +
          `Kode: ${promoCode}\n` +
          `Subtotal: Rp${subtotal.toLocaleString(
            'id-ID',
          )}\n` +
          `Diskon: Rp${discount.toLocaleString(
            'id-ID',
          )}\n` +
          `Total: Rp${(
            subtotal - discount
          ).toLocaleString(
            'id-ID',
          )}\n\n` +
          'Promo berhasil diterapkan. Silakan lanjutkan checkout.',
      );

      return;
    }

    /*
     * Unhandled Telegram message.
     */
    if (!text) {
      return;
    }

    this.logger.debug(
      `Unhandled Telegram message: "${text}"`,
    );

    await this.telegramService.sendMessage(
      message.chat.id,
      `Pesan diterima: ${text}`,
    );
  }
}
