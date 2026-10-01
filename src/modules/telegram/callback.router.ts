import {
  Inject,
  Injectable,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { ProductHandler } from '../product/product.handler';
import { CustomerService } from '../customer/customer.service';
import { CartService } from '../cart/cart.service';
import { OrderService } from '../order/order.service';
import { CheckoutStateService } from './checkout-state.service';
import { PaymentMethod } from '../payment/payment.service';
import { ConfigService } from '@nestjs/config';
import { AdminProductStateService } from './admin-product-state.service';
import { AdminAccessService } from './admin-access.service';
import { ProductService } from '../product/product.service';
import { MidtransPaymentService } from '../payment/midtrans-payment.service';

@Injectable()
export class CallbackRouter {
  private readonly logger = new Logger(
    CallbackRouter.name,
  );

  constructor(
    private readonly telegramService: TelegramService,
    private readonly productHandler: ProductHandler,
    private readonly customerService: CustomerService,
    private readonly cartService: CartService,
    private readonly orderService: OrderService,
    private readonly checkoutStateService: CheckoutStateService,
     private readonly configService: ConfigService,
    private readonly adminProductStateService: AdminProductStateService,
    private readonly adminAccessService: AdminAccessService,
    private readonly productService: ProductService,
    @Inject(forwardRef(() => MidtransPaymentService))
  private readonly midtransPaymentService: MidtransPaymentService,
) {}

  async route(callbackQuery: {
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
  }): Promise<void> {
    const callbackData = callbackQuery.data;
    const chatId =
      callbackQuery.message?.chat.id;

    await this.telegramService.answerCallbackQuery(
      callbackQuery.id,
    );

    if (!callbackData || !chatId) {
      return;
    }

    this.logger.log(
      `Telegram callback received: ${callbackData}`,
    );

    /*
     * Add product to cart
     */

    /*
 * Order detail
 */
if (callbackData.startsWith('order:detail:')) {
  const orderId = callbackData.replace(
    'order:detail:',
    '',
  );

  await this.handleOrderDetail(
    chatId,
    callbackQuery.from,
    orderId,
  );

  return;
}

if (
  callbackData.startsWith(
    'admin:product:category:',
  )
) {
  if (
    !this.adminAccessService.isAdmin(
      callbackQuery.from.id,
    )
  ) {
    await this.telegramService.sendMessage(
      chatId,
      '⛔ Akses ditolak.\n\n' +
        'Kamu bukan admin.',
    );

    return;
  }

  const categoryId =
    callbackData.substring(
      'admin:product:category:'.length,
    );

  if (!categoryId) {
    await this.telegramService.sendMessage(
      chatId,
      '⚠️ Kategori tidak valid.',
    );

    return;
  }

  const telegramUserId = String(
    callbackQuery.from.id,
  );

  const state =
    this.adminProductStateService.get(
      telegramUserId,
    );

  if (
    !state ||
    state.step !== 'category'
  ) {
    await this.telegramService.sendMessage(
      chatId,
      '⚠️ Sesi tambah produk tidak ditemukan.\n\n' +
        'Silakan mulai kembali dari Admin Panel.',
    );

    return;
  }

  this.adminProductStateService.set(
    telegramUserId,
    {
      ...state,
      step: 'stock',
      categoryId,
    },
  );

  await this.telegramService.sendMessage(
    chatId,
    '📊 Masukkan stok produk:\n\n' +
      'Contoh: 10',
  );

  return;
}

    if (callbackData.startsWith('cart:add:')) {
      await this.handleAddToCart(
        chatId,
        callbackQuery.from,
        callbackData,
      );

      return;
    }

    /*
     * Increase cart item quantity
     */
    if (
      callbackData.startsWith(
        'cart:increase:',
      )
    ) {
      await this.handleIncreaseItem(
        chatId,
        callbackQuery.from,
        callbackData,
      );

      return;
    }

    /*
     * Decrease cart item quantity
     */
    if (
      callbackData.startsWith(
        'cart:decrease:',
      )
    ) {
      await this.handleDecreaseItem(
        chatId,
        callbackQuery.from,
        callbackData,
      );

      return;
    }

    /*
 * Cancel order
 */
if (callbackData.startsWith('order:cancel:')) {
  await this.handleOrderCancel(
    chatId,
    callbackQuery.from,
    callbackData,
  );

  return;
}

    /*
     * Remove cart item
     */
    if (
      callbackData.startsWith(
        'cart:remove:',
      )
    ) {
      await this.handleRemoveItem(
        chatId,
        callbackQuery.from,
        callbackData,
      );

      return;
    }

    /*
 * Product detail quantity controls
 */
if (
  callbackData.startsWith(
    'catalog:qty:',
  )
) {
  const parts =
    callbackData.split(':');

const action = parts[2];

const productId = parts[3];

const currentQuantity = Number(
  parts[4],
);

const page = Number(
  parts[5] ?? '1',
);

if (
  !action ||
  !productId ||
  !Number.isInteger(currentQuantity) ||
  currentQuantity < 1
) {
  await this.telegramService.sendMessage(
    chatId,
    '⚠️ Quantity produk tidak valid.',
  );

  return;
}

await this.handleProductQuantity(
  chatId,
  productId,
  currentQuantity,
  action,
  page,
  callbackQuery.message?.message_id,
);

return;
}

    /*
     * Quantity display button.
     * Intentionally does nothing.
     */
    if (callbackData === 'cart:noop') {
      return;
    }

/*
 * Back to catalog from product detail
 */
if (
  callbackData.startsWith(
    'catalog:back:',
  )
) {
  const page = Number(
    callbackData.substring(
      'catalog:back:'.length,
    ),
  );

  if (
    !Number.isInteger(page) ||
    page < 1
  ) {
    await this.telegramService.sendMessage(
      chatId,
      '⚠️ Halaman katalog tidak valid.',
    );

    return;
  }

  await this.handleCatalog(
    chatId,
    page,
  );

  return;
}

/*
 * Catalog pagination
 */
if (
  callbackData.startsWith(
    'catalog:page:',
  )
) {
  const page = Number(
    callbackData.substring(
      'catalog:page:'.length,
    ),
  );

  if (
    !Number.isInteger(page) ||
    page < 1
  ) {
    await this.telegramService.sendMessage(
      chatId,
      '⚠️ Halaman katalog tidak valid.',
    );

    return;
  }

  await this.handleCatalog(
    chatId,
    page,
    callbackQuery.message?.message_id,
  );

  return;
}

/*
 * Catalog product detail
 */
if (
  callbackData.startsWith(
    'catalog:product:',
  )
) {
  const parts =
    callbackData.split(':');

  const productId = parts[2];
  const page = Number(
    parts[3] ?? '1',
  );

  if (!productId) {
    await this.telegramService.sendMessage(
      chatId,
      '⚠️ Produk tidak valid.',
    );

    return;
  }

  await this.handleProductDetail(
    chatId,
    productId,
    Number.isInteger(page) && page > 0
      ? page
      : 1,
  );

  return;
}

    if (
  callbackData === 'admin:product:add'
) {
  if (
    !this.adminAccessService.isAdmin(
      callbackQuery.from.id,
    )
  ) {
    await this.telegramService.sendMessage(
      chatId,
      '⛔ Akses ditolak.\n\nKamu bukan admin.',
    );

    return;
  }

  this.adminProductStateService.start(
    String(callbackQuery.from.id),
  );

  await this.telegramService.sendMessage(
    chatId,
    '➕ TAMBAH PRODUK\n\n' +
      'Silakan masukkan nama produk:',
  );

  return;
}

if (
  callbackData.startsWith(
    'admin:product:edit:desc:',
  )
) {
  if (
    !this.adminAccessService.isAdmin(
      callbackQuery.from.id,
    )
  ) {
    await this.telegramService.sendMessage(
      chatId,
      '⛔ Akses ditolak.\n\nKamu bukan admin.',
    );

    return;
  }

  const productId =
    callbackData.substring(
      'admin:product:edit:desc:'.length,
    );

  const product =
    await this.productService.findById(
      productId,
    );

  if (!product) {
    await this.telegramService.sendMessage(
      chatId,
      '❌ Produk tidak ditemukan.',
    );

    return;
  }

  this.adminProductStateService.set(
    String(callbackQuery.from.id),
    {
      step: 'edit-description',
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      description:
        product.description ?? '',
      ...(product.images[0]?.url
        ? {
            photoFileId:
              product.images[0].url,
          }
        : {}),
      categoryId: product.categoryId,
      stock: product.stock,
    },
  );

  await this.telegramService.sendMessage(
    chatId,
    '📝 EDIT DESKRIPSI PRODUK\n\n' +
      `Deskripsi saat ini:\n${
        product.description ||
        '(Belum ada deskripsi)'
      }\n\n` +
      'Silakan masukkan deskripsi baru:',
  );

  return;
}

if (
  callbackData.startsWith(
    'admin:product:edit:stock:',
  )
) {
  if (
    !this.adminAccessService.isAdmin(
      callbackQuery.from.id,
    )
  ) {
    await this.telegramService.sendMessage(
      chatId,
      '⛔ Akses ditolak.\n\nKamu bukan admin.',
    );

    return;
  }

  const productId =
    callbackData.substring(
      'admin:product:edit:stock:'.length,
    );

  const product =
    await this.productService.findById(
      productId,
    );

  if (!product) {
    await this.telegramService.sendMessage(
      chatId,
      '❌ Produk tidak ditemukan.',
    );

    return;
  }

  this.adminProductStateService.set(
    String(callbackQuery.from.id),
    {
      step: 'edit-stock',
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      description:
        product.description ?? '',
      ...(product.images[0]?.url
        ? {
            photoFileId:
              product.images[0].url,
          }
        : {}),
      categoryId: product.categoryId,
      stock: product.stock,
    },
  );

  await this.telegramService.sendMessage(
    chatId,
    '📊 EDIT STOK PRODUK\n\n' +
      `📦 ${product.name}\n` +
      `Stok saat ini: ${product.stock}\n\n` +
      'Silakan masukkan stok baru.\n' +
      'Contoh: 10',
  );

  return;
}

if (
  callbackData.startsWith(
    'admin:product:archive:',
  )
) {
  if (
    !this.adminAccessService.isAdmin(
      callbackQuery.from.id,
    )
  ) {
    await this.telegramService.sendMessage(
      chatId,
      '⛔ Akses ditolak.\n\nKamu bukan admin.',
    );

    return;
  }

  const productId =
    callbackData.substring(
      'admin:product:archive:'.length,
    );

  const product =
    await this.productService.findById(
      productId,
    );

  if (!product) {
    await this.telegramService.sendMessage(
      chatId,
      '❌ Produk tidak ditemukan.',
    );

    return;
  }

  await this.telegramService.sendMessage(
    chatId,
    '⚠️ KONFIRMASI ARSIP PRODUK\n\n' +
      `📦 ${product.name}\n` +
      `SKU: ${product.sku}\n\n` +
      'Produk akan diubah menjadi status ARCHIVED.\n' +
      'Lanjutkan?',
    [
      [
        {
          text: '✅ Ya, Arsipkan',
         callback_data:
  `admin:product:arch:${product.id}`,
        },
      ],
      [
        {
          text: '❌ Batal',
          callback_data:
            `admin:product:edit:${product.id}`,
        },
      ],
    ],
  );

  return;
}

if (
  callbackData.startsWith(
    'admin:product:edit:category:',
  )
) {
  if (
    !this.adminAccessService.isAdmin(
      callbackQuery.from.id,
    )
  ) {
    await this.telegramService.sendMessage(
      chatId,
      '⛔ Akses ditolak.\n\nKamu bukan admin.',
    );

    return;
  }

  const productId =
    callbackData.substring(
      'admin:product:edit:category:'.length,
    );

  const product =
    await this.productService.findById(
      productId,
    );

  if (!product) {
    await this.telegramService.sendMessage(
      chatId,
      '❌ Produk tidak ditemukan.',
    );

    return;
  }

  const categories =
    await this.productService.findActiveCategories();

  if (categories.length === 0) {
    await this.telegramService.sendMessage(
      chatId,
      '⚠️ Belum ada kategori aktif.',
    );

    return;
  }

  this.adminProductStateService.set(
    String(callbackQuery.from.id),
    {
      step: 'edit-category',
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      description:
        product.description ?? '',
      ...(product.images[0]?.url
        ? {
            photoFileId:
              product.images[0].url,
          }
        : {}),
      categoryId: product.categoryId,
      stock: product.stock,
    },
  );

  const categoryKeyboard =
    categories.map((category) => [
      {
        text: `📂 ${category.name}`,
        callback_data:
          `admin:product:setcat:${category.id}`,
      },
    ]);

  categoryKeyboard.push([
    {
      text: '🔙 Kembali',
      callback_data:
        `admin:product:edit:${product.id}`,
    },
  ]);

  await this.telegramService.sendMessage(
    chatId,
    '📂 EDIT KATEGORI PRODUK\n\n' +
      `📦 ${product.name}\n\n` +
      'Pilih kategori baru:',
    categoryKeyboard,
  );

  return;
}

if (
  callbackData.startsWith(
    'admin:product:edit:price:',
  )
) {
  if (
    !this.adminAccessService.isAdmin(
      callbackQuery.from.id,
    )
  ) {
    await this.telegramService.sendMessage(
      chatId,
      '⛔ Akses ditolak.\n\nKamu bukan admin.',
    );

    return;
  }

  const productId =
    callbackData.substring(
      'admin:product:edit:price:'.length,
    );

  const product =
    await this.productService.findById(
      productId,
    );

  if (!product) {
    await this.telegramService.sendMessage(
      chatId,
      '❌ Produk tidak ditemukan.',
    );

    return;
  }

  this.adminProductStateService.set(
    String(callbackQuery.from.id),
    {
      step: 'edit-price',
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      description:
        product.description ?? '',
      ...(product.images[0]?.url
        ? {
            photoFileId:
              product.images[0].url,
          }
        : {}),
      categoryId: product.categoryId,
      stock: product.stock,
    },
  );

  await this.telegramService.sendMessage(
    chatId,
    '💰 EDIT HARGA PRODUK\n\n' +
      `Harga saat ini: Rp${Number(
        product.price,
      ).toLocaleString('id-ID')}\n\n` +
      'Silakan masukkan harga baru:\n' +
      'Contoh: 25000',
  );

  return;
}

if (
  callbackData.startsWith(
    'admin:product:edit:price:',
  )
) {
  if (
    !this.adminAccessService.isAdmin(
      callbackQuery.from.id,
    )
  ) {
    await this.telegramService.sendMessage(
      chatId,
      '⛔ Akses ditolak.\n\nKamu bukan admin.',
    );

    return;
  }

  const productId =
    callbackData.substring(
      'admin:product:edit:price:'.length,
    );

  const product =
    await this.productService.findById(
      productId,
    );

  if (!product) {
    await this.telegramService.sendMessage(
      chatId,
      '❌ Produk tidak ditemukan.',
    );

    return;
  }

  this.adminProductStateService.set(
    String(callbackQuery.from.id),
    {
      step: 'edit-price',
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      description:
        product.description ?? '',
      ...(product.images[0]?.url
        ? {
            photoFileId:
              product.images[0].url,
          }
        : {}),
      categoryId: product.categoryId,
      stock: product.stock,
    },
  );

  await this.telegramService.sendMessage(
    chatId,
    '💰 EDIT HARGA PRODUK\n\n' +
      `Harga saat ini: Rp${Number(
        product.price,
      ).toLocaleString('id-ID')}\n\n` +
      'Silakan masukkan harga baru:\n' +
      'Contoh: 25000',
  );

  return;
}

if (
  callbackData.startsWith(
    'admin:product:edit:name:',
  )
) {
  if (
    !this.adminAccessService.isAdmin(
      callbackQuery.from.id,
    )
  ) {
    await this.telegramService.sendMessage(
      chatId,
      '⛔ Akses ditolak.\n\nKamu bukan admin.',
    );

    return;
  }

  const productId =
    callbackData.substring(
      'admin:product:edit:name:'.length,
    );

  const product =
    await this.productService.findById(
      productId,
    );

  if (!product) {
    await this.telegramService.sendMessage(
      chatId,
      '❌ Produk tidak ditemukan.',
    );

    return;
  }

 this.adminProductStateService.set(
  String(callbackQuery.from.id),
 {
  step: 'edit-name',
  productId: product.id,
  name: product.name,
    price: Number(product.price),
    description: product.description ?? '',
    ...(product.images[0]?.url
      ? { photoFileId: product.images[0].url }
      : {}),
    categoryId: product.categoryId,
    stock: product.stock,
  },
);

  await this.telegramService.sendMessage(
    chatId,
    '✏️ EDIT NAMA PRODUK\n\n' +
      `Nama saat ini: ${product.name}\n\n` +
      'Silakan masukkan nama produk baru:',
  );

  return;
}

if (
  callbackData.startsWith(
    'admin:product:edit:',
  )
) {
  if (
    !this.adminAccessService.isAdmin(
      callbackQuery.from.id,
    )
  ) {
    await this.telegramService.sendMessage(
      chatId,
      '⛔ Akses ditolak.\n\nKamu bukan admin.',
    );

    return;
  }

  const productId =
    callbackData.substring(
      'admin:product:edit:'.length,
    );

  const product =
    await this.productService.findById(
      productId,
    );

  if (!product) {
    await this.telegramService.sendMessage(
      chatId,
      '❌ Produk tidak ditemukan.',
    );

    return;
  }

  await this.telegramService.sendMessage(
    chatId,
    '✏️ EDIT PRODUK\n\n' +
      `📦 ${product.name}\n` +
      `💰 Rp${Number(product.price).toLocaleString('id-ID')}\n` +
      `📊 Stok: ${product.stock}\n\n` +
      'Pilih data yang ingin diubah:',
    [
      [
        {
          text: '✏️ Nama',
          callback_data:
            `admin:product:edit:name:${product.id}`,
        },
      ],
      [
        {
          text: '💰 Harga',
          callback_data:
            `admin:product:edit:price:${product.id}`,
        },
      ],
      [
        {
          text: '📝 Deskripsi',
          callback_data:
            `admin:product:edit:desc:${product.id}`,
        },
      ],
      [
        {
          text: '📂 Kategori',
          callback_data:
            `admin:product:edit:category:${product.id}`,
        },
      ],
      [
        {
          text: '📊 Stok',
          callback_data:
            `admin:product:edit:stock:${product.id}`,
        },
      ],
      [
        {
          text: '🗑️ Arsipkan Produk',
          callback_data:
            `admin:product:archive:${product.id}`,
        },
      ],
      [
        {
          text: '🔙 Daftar Produk',
          callback_data:
            'admin:product:list',
        },
      ],
    ],
  );

  return;
}

if (
  callbackData.startsWith(
    'admin:product:setcat:',
  )
) {
  if (
    !this.adminAccessService.isAdmin(
      callbackQuery.from.id,
    )
  ) {
    await this.telegramService.sendMessage(
      chatId,
      '⛔ Akses ditolak.\n\nKamu bukan admin.',
    );

    return;
  }

  const categoryId =
    callbackData.substring(
      'admin:product:setcat:'.length,
    );

  if (!categoryId) {
    await this.telegramService.sendMessage(
      chatId,
      '❌ Kategori tidak valid.',
    );

    return;
  }

  const telegramUserId =
    String(callbackQuery.from.id);

  const state =
    this.adminProductStateService.get(
      telegramUserId,
    );

  if (!state?.productId) {
    this.adminProductStateService.clear(
      telegramUserId,
    );

    await this.telegramService.sendMessage(
      chatId,
      '❌ Data produk yang sedang diedit tidak ditemukan.\n\n' +
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

  const product =
    await this.productService.findById(
      state.productId,
    );

  if (!product) {
    this.adminProductStateService.clear(
      telegramUserId,
    );

    await this.telegramService.sendMessage(
      chatId,
      '❌ Produk tidak ditemukan.',
    );

    return;
  }

  const categories =
    await this.productService.findActiveCategories();

  const selectedCategory =
    categories.find(
      (category) =>
        category.id === categoryId,
    );

  if (!selectedCategory) {
    await this.telegramService.sendMessage(
      chatId,
      '❌ Kategori tidak ditemukan atau tidak aktif.',
    );

    return;
  }

  const updatedProduct =
    await this.productService.updateProduct(
      state.productId,
      {
        categoryId,
      },
    );

  this.adminProductStateService.clear(
    telegramUserId,
  );

  await this.telegramService.sendMessage(
    chatId,
    '✅ KATEGORI PRODUK BERHASIL DIUBAH\n\n' +
      `📦 ${updatedProduct.name}\n` +
      `📂 ${selectedCategory.name}`,
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
  callbackData.startsWith(
    'admin:product:arch:',
  )
) {
  if (
    !this.adminAccessService.isAdmin(
      callbackQuery.from.id,
    )
  ) {
    await this.telegramService.sendMessage(
      chatId,
      '⛔ Akses ditolak.\n\nKamu bukan admin.',
    );

    return;
  }
const productId =
  callbackData.substring(
    'admin:product:arch:'.length,
  );

  if (!productId) {
    await this.telegramService.sendMessage(
      chatId,
      '❌ Produk tidak valid.',
    );

    return;
  }

  const product =
    await this.productService.findById(
      productId,
    );

  if (!product) {
    await this.telegramService.sendMessage(
      chatId,
      '❌ Produk tidak ditemukan.',
    );

    return;
  }

  const archivedProduct =
    await this.productService.archiveProduct(
      productId,
    );

  await this.telegramService.sendMessage(
    chatId,
    '✅ PRODUK BERHASIL DIARSIPKAN\n\n' +
      `📦 ${archivedProduct.name}\n` +
      `🆔 SKU: ${archivedProduct.sku}\n` +
      `📌 Status: ${archivedProduct.status}`,
    [
      [
        {
          text: '📦 Daftar Produk',
          callback_data:
            'admin:product:list',
        },
      ],
      [
        {
          text: '🔐 Admin Panel',
          callback_data:
            'admin:open',
        },
      ],
    ],
  );

  return;
}

if (callbackData === 'menu:main') {
  await this.telegramService.sendMessage(
    chatId,
    '👋 Halo Nozy!\n\n' +
      'Selamat datang di NozTech Store 🛍️\n\n' +
      'Belanja mudah, cepat, dan nyaman.\n\n' +
      'Silakan pilih menu di bawah:',
    [
      [
        {
          text: '🛍️ Katalog Produk',
          callback_data: 'catalog:open',
        },
      ],
      [
        {
          text: '🔥 Promo',
          callback_data: 'promo:open',
        },
        {
          text: '🛒 Keranjang',
          callback_data: 'cart:open',
        },
      ],
      [
        {
          text: '📦 Pesanan Saya',
          callback_data: 'orders:open',
        },
      ],
      [
        {
          text: '👤 Akun Saya',
          callback_data: 'account:open',
        },
        {
          text: '💬 Bantuan',
          callback_data: 'help:open',
        },
      ],
    ],
  );

  return;
}

if (
  callbackData.startsWith(
    'admin:fulfillment:deliver:',
  )
) {
  if (
    !this.adminAccessService.isAdmin(
      callbackQuery.from.id,
    )
  ) {
    return;
  }

  const orderId =
    callbackData.substring(
      'admin:fulfillment:deliver:'.length,
    );

  if (!orderId) {
    await this.telegramService.sendMessage(
      chatId,
      '⚠️ ID pesanan tidak valid.',
    );

    return;
  }

  try {
    const result =
      await this.orderService.completeSupplierFulfillment(
        orderId,
      );

    if (result.idempotent) {
      await this.telegramService.sendMessage(
        chatId,
        'ℹ️ Pesanan tersebut sudah selesai diproses.',
      );

      return;
    }

    await this.telegramService.sendMessage(
      chatId,
      '✅ <b>FULFILLMENT BERHASIL DITANDAI TERKIRIM</b>\n\n' +
        `🧾 Order: ${result.order.orderNumber}\n` +
        `👤 Customer: ${result.order.customer.name}\n\n` +
        (
          result.orderCompleted
            ? '📦 Order: <b>DELIVERED</b>'
            : '⏳ Masih ada item lain yang belum DELIVERED.'
        ),
      undefined,
      'HTML',
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Gagal memperbarui fulfillment.';

    await this.telegramService.sendMessage(
      chatId,
      `⚠️ ${message}`,
    );
  }

  return;
}

    switch (callbackData) {
      case 'catalog:open':
  await this.handleCatalog(
    chatId,
    1,
  );
  break;

      case 'cart:open':
        await this.handleCart(
          chatId,
          callbackQuery.from,
        );
        break;

      case 'cart:checkout':
        await this.handleCheckout(
          chatId,
          callbackQuery.from,
        );
        break;

        case 'payment:select':
  await this.handlePaymentSelection(
    chatId,
  );
  break;

        case 'payment:cash':
  await this.handlePaymentMethod(
    chatId,
    callbackQuery.from,
    'CASH',
  );
  break;

case 'payment:bank_transfer':
  await this.handlePaymentMethod(
    chatId,
    callbackQuery.from,
    'BANK_TRANSFER',
  );
  break;

case 'payment:e_wallet':
  await this.handlePaymentMethod(
    chatId,
    callbackQuery.from,
    'E_WALLET',
  );
  break;

case 'payment:qris':
  await this.handlePaymentMethod(
    chatId,
    callbackQuery.from,
    'QRIS',
  );
  break;

case 'payment:cod':
  await this.handlePaymentMethod(
    chatId,
    callbackQuery.from,
    'COD',
  );
  break;

      case 'checkout:confirm':
        await this.handleCheckoutConfirm(
          chatId,
          callbackQuery.from,
        );
        break;

     case 'checkout:cancel':
  await this.handleCheckoutCancel(
    chatId,
    callbackQuery.from,
  );
  break;

      case 'promo:open':
  this.checkoutStateService.setWaitingForPromo(
    String(callbackQuery.from.id),
  );

  await this.telegramService.sendMessage(
    chatId,
    '🎟️ PROMO\n\n' +
      'Silakan masukkan kode promo kamu.\n' +
      'Contoh: HEMAT10',
  );
  break;

    case 'orders:open':
  await this.handleOrders(
    chatId,
    callbackQuery.from,
  );
  break;

     case 'account:open':
  await this.handleAccount(
    chatId,
    callbackQuery.from,
  );
  break;

     case 'help:open':
  await this.handleHelp(chatId);
  break;

 case 'admin:open':
  if (
    !this.adminAccessService.isAdmin(
      callbackQuery.from.id,
    )
  ) {
    await this.telegramService.sendMessage(
      chatId,
      '⛔ Akses ditolak.\n\n' +
        'Kamu bukan admin.',
    );

    break;
  }

  await this.telegramService.sendMessage(
    chatId,
    '🔐 ADMIN PANEL\n\n' +
      'Pilih menu admin:',
    [
      [
        {
          text: '➕ Tambah Produk',
          callback_data:
            'admin:product:add',
        },
      ],
      [
        {
          text: '📦 Daftar Produk',
          callback_data:
            'admin:product:list',
        },
      ],
      [
        {
          text: '🧾 Pesanan Supplier',
          callback_data:
            'admin:supplier-orders',
        },
      ],
    ],
  );

  break;

case 'admin:supplier-orders': {
  if (
    !this.adminAccessService.isAdmin(
      callbackQuery.from.id,
    )
  ) {
    return;
  }

  try {
    const orders =
      await this.orderService
        .findWaitingSupplierOrders();

    if (orders.length === 0) {
      await this.telegramService.sendMessage(
        chatId,
        '🧾 <b>PESANAN SUPPLIER</b>\n\n' +
          'Tidak ada pesanan yang sedang menunggu supplier.',
        undefined,
        'HTML',
      );

      return;
    }

    const lines: string[] = [];
    const keyboard: any[][] = [];

    lines.push(
      '🧾 <b>PESANAN SUPPLIER</b>',
      '',
      'Setelah supplier mengirim link, kirim langsung ke customer.',
      'Setelah benar-benar terkirim, tekan tombol di bawah.',
      '',
    );

    for (const order of orders) {
      const customer =
        order.customer;

      const username =
        customer.telegramUsername
          ? `@${customer.telegramUsername}`
          : customer.name;

      lines.push(
        `🧾 <b>${order.orderNumber}</b>`,
        `👤 ${username}`,
        `📱 Telegram ID: ${customer.telegramId ?? '-'}`,
      );

      for (const item of order.items) {
        lines.push(
          `📦 ${item.product.name}`,
          `🔢 Qty: ${item.quantity}`,
          `⏳ Status: WAITING_SUPPLIER`,
        );
      }

      lines.push('');

      keyboard.push([
        {
          text: `✅ SUDAH DIKIRIM · ${order.orderNumber}`,
          callback_data:
            `admin:fulfillment:deliver:${order.id}`,
        },
      ]);
    }

    keyboard.push([
      {
        text: '🔙 Kembali ke Admin Panel',
        callback_data: 'admin:open',
      },
    ]);

    await this.telegramService.sendMessage(
      chatId,
      lines.join('\n').trim(),
      keyboard,
      'HTML',
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Gagal mengambil pesanan supplier.';

    this.logger.error(
      `Supplier order list error: ${message}`,
    );

    await this.telegramService.sendMessage(
      chatId,
      `⚠️ ${message}`,
    );
  }

  break;
}

  case 'admin:product:list':
  if (
    !this.adminAccessService.isAdmin(
      callbackQuery.from.id,
    )
  ) {
    await this.telegramService.sendMessage(
      chatId,
      '⛔ Akses ditolak.\n\n' +
        'Kamu bukan admin.',
    );

    break;
  }

  await this.handleAdminProductList(
    chatId,
  );

  break;

 case 'admin:product:confirm':
  if (
    !this.adminAccessService.isAdmin(
      callbackQuery.from.id,
    )
  ) {
    await this.telegramService.sendMessage(
      chatId,
      '⛔ Akses ditolak.\n\n' +
        'Kamu bukan admin.',
    );

    break;
  }

 await this.handleAdminProductConfirm(
  chatId,
  callbackQuery.from.id,
);

  break;

  case 'admin:product:cancel':
  if (
    !this.adminAccessService.isAdmin(
      callbackQuery.from.id,
    )
  ) {
    await this.telegramService.sendMessage(
      chatId,
      '⛔ Akses ditolak.\n\n' +
        'Kamu bukan admin.',
    );

    break;
  }

  this.adminProductStateService.clear(
    String(callbackQuery.from.id),
  );

  await this.telegramService.sendMessage(
    chatId,
    '❌ TAMBAH PRODUK DIBATALKAN\n\n' +
      'Data produk sementara telah dibersihkan.',
    [
      [
        {
          text: '🔐 Admin Panel',
          callback_data: 'admin:open',
        },
      ],
    ],
  );

  break;

      default:
        this.logger.warn(
          `Unknown callback: ${callbackData}`,
        );

        await this.telegramService.sendMessage(
          chatId,
          '⚠️ Menu tersebut belum tersedia.',
        );
    }
  }

  private async handleCatalog(
  chatId: number,
  page = 1,
  messageId?: number,
): Promise<void> {
  try {
    const catalog =
      await this.productHandler.handle(
        chatId,
        page,
      );

    /*
     * Initial catalog:
     * tampilkan logo jika file ID sudah dikonfigurasi.
     */
    if (
      !messageId &&
      catalog.logoFileId
    ) {
      await this.telegramService.sendPhoto(
        chatId,
        catalog.logoFileId,
        '🛍️ NozTech Commerce',
      );
    }

    /*
     * Pagination:
     * edit pesan katalog yang sama.
     */
    if (messageId) {
      await this.telegramService.editMessageText(
        chatId,
        messageId,
        catalog.text,
        undefined,
        catalog.inlineKeyboard,
      );

      return;
    }

    await this.telegramService.sendMessage(
      chatId,
      catalog.text,
      catalog.inlineKeyboard,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Gagal membuka katalog.';

    this.logger.error(
      `Catalog error: ${message}`,
    );

    await this.telegramService.sendMessage(
      chatId,
      `⚠️ ${message}`,
    );
  }
}

private async handleProductDetail(
  chatId: number,
  productId: string,
  page: number,
): Promise<void> {
  try {
    const product =
      await this.productHandler.getDetail(
        productId,
      );

    if (!product) {
      await this.telegramService.sendMessage(
        chatId,
        '❌ Produk tidak ditemukan.',
        [
          [
            {
              text: '⬅️ Kembali ke Katalog',
              callback_data:
                `catalog:back:${page}`,
            },
          ],
        ],
      );

      return;
    }

    const stockText =
      product.stock > 0
        ? `🟢 ${product.stock} tersedia`
        : '🔴 Habis';

   const selectedQuantity = 1;
const selectedTotal =
  product.price * selectedQuantity;

const caption =
  '╭────────────────────────────╮\n' +
  '│ 📦 DETAIL PRODUK\n' +
  '├────────────────────────────╯\n' +
  '│\n' +
  `│ 🎯 ${product.name}\n` +
  '│\n' +
  '│ 💰 Harga\n' +
  `│    Rp${product.price.toLocaleString('id-ID')}\n` +
  '│\n' +
  '│ 📦 Stok\n' +
  `│    ${stockText}\n` +
  '│\n' +
  (
    product.description
      ? '│ 📝 Deskripsi\n' +
        `│    ${product.description}\n` +
        '│\n'
      : ''
  ) +
  '├────────────────────────────\n' +
  '│ 🔢 JUMLAH\n' +
  '│\n' +
  '│       [ − ]   1   [ + ]\n' +
  '│\n' +
  '│ 💵 TOTAL\n' +
  `│    Rp${selectedTotal.toLocaleString('id-ID')}\n` +
  '╰────────────────────────────╮\n' +
  'Silakan pilih tindakan di bawah.';
   const keyboard = [];

if (product.stock > 0) {
  keyboard.push([
   {
  text: '−',
  callback_data:
    `catalog:qty:decrease:${product.id}:1:${page}`,
},
{
  text: '1',
  callback_data: 'catalog:noop',
},
{
  text: '+',
  callback_data:
    `catalog:qty:increase:${product.id}:1:${page}`,
},
  ]);

  keyboard.push([
    {
  text: '🛒 Tambah ke Keranjang',
  callback_data:
    `cart:add:${product.id}:${selectedQuantity}`,
},
  ]);
} else {
  keyboard.push([
    {
      text: '🔴 Produk Habis',
      callback_data: 'catalog:noop',
    },
  ]);
}

keyboard.push([
  {
    text: '⬅️ Kembali ke Katalog',
    callback_data:
      `catalog:back:${page}`,
  },
]);
    if (product.photoFileId) {
      await this.telegramService.sendPhoto(
        chatId,
        product.photoFileId,
        caption,
        keyboard,
      );
    } else {
      await this.telegramService.sendMessage(
        chatId,
        caption,
        keyboard,
      );
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Gagal membuka detail produk.';

    this.logger.error(
      `Product detail error: ${message}`,
    );

    await this.telegramService.sendMessage(
      chatId,
      `⚠️ ${message}`,
    );
  }

}

private async handleAddToCart(
  chatId: number,
  telegramUser: {
    id: number;
    first_name?: string;
    username?: string;
  },
  callbackData: string,
): Promise<void> {
  const parts = callbackData.split(':');

const productId = parts[2];

const selectedQuantity = Number(
  parts[3] ?? '1',
);

  if (
  !productId ||
  !Number.isInteger(selectedQuantity) ||
  selectedQuantity < 1
) {
  await this.telegramService.sendMessage(
    chatId,
    '⚠️ Data produk atau quantity tidak valid.',
  );

  return;
}

  try {
    const customer =
      await this.customerService.findOrCreateByTelegram(
        String(telegramUser.id),
        telegramUser.first_name,
        telegramUser.username,
      );

   await this.cartService.addItem(
  customer.id,
  productId,
);

for (let i = 1; i < selectedQuantity; i++) {
  await this.cartService.increaseItem(
    customer.id,
    productId,
  );
}

    await this.telegramService.sendMessage(
      chatId,
      '✅ Produk berhasil ditambahkan ke keranjang.\n\n' +
        'Silakan lanjutkan belanja atau buka keranjang kamu.',
      [
        [
          {
            text: '🛒 Lihat Keranjang',
            callback_data: 'cart:open',
          },
        ],
        [
          {
            text: '🛍️ Kembali ke Katalog',
            callback_data: 'catalog:open',
          },
        ],
      ],
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Gagal menambahkan produk ke keranjang.';

    this.logger.error(
      `Add cart item error: ${message}`,
    );

    await this.telegramService.sendMessage(
      chatId,
      `⚠️ ${message}`,
    );
  }
}

private async handleIncreaseItem(
  chatId: number,
  telegramUser: {
    id: number;
    first_name?: string;
    username?: string;
  },
  callbackData: string,
): Promise<void> {
  const productId = callbackData.substring(
    'cart:increase:'.length,
  );

  if (!productId) {
    await this.telegramService.sendMessage(
      chatId,
      '⚠️ Produk tidak valid.',
    );
    return;
  }

  try {
    const customer =
      await this.customerService.findOrCreateByTelegram(
        String(telegramUser.id),
        telegramUser.first_name,
        telegramUser.username,
      );

    await this.cartService.increaseItem(
      customer.id,
      productId,
    );

    await this.handleCart(
      chatId,
      telegramUser,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Gagal menambah jumlah produk.';

    this.logger.error(
      `Increase cart item error: ${message}`,
    );

    await this.telegramService.sendMessage(
      chatId,
      `⚠️ ${message}`,
    );
  }
}

private async handleDecreaseItem(
  chatId: number,
  telegramUser: {
    id: number;
    first_name?: string;
    username?: string;
  },
  callbackData: string,
): Promise<void> {
  const productId = callbackData.substring(
    'cart:decrease:'.length,
  );

  if (!productId) {
    await this.telegramService.sendMessage(
      chatId,
      '⚠️ Produk tidak valid.',
    );
    return;
  }

  try {
    const customer =
      await this.customerService.findOrCreateByTelegram(
        String(telegramUser.id),
        telegramUser.first_name,
        telegramUser.username,
      );

    await this.cartService.decreaseItem(
      customer.id,
      productId,
    );

    await this.handleCart(
      chatId,
      telegramUser,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Gagal mengurangi jumlah produk.';

    this.logger.error(
      `Decrease cart item error: ${message}`,
    );

    await this.telegramService.sendMessage(
      chatId,
      `⚠️ ${message}`,
    );
  }
}

private async handleProductQuantity(
  chatId: number,
  productId: string,
  currentQuantity: number,
  action: string,
  page: number,
  messageId?: number,
): Promise<void> {
  try {
    const product =
      await this.productHandler.getDetail(
        productId,
      );

    if (!product) {
      await this.telegramService.sendMessage(
        chatId,
        '❌ Produk tidak ditemukan.',
        [
          [
            {
              text: '⬅️ Kembali ke Katalog',
              callback_data:
                `catalog:back:${page}`,
            },
          ],
        ],
      );

      return;
    }

    let quantity = currentQuantity;

if (action === 'increase') {
  quantity = Math.min(
    currentQuantity + 1,
    product.stock,
  );
}

if (action === 'decrease') {
  quantity = Math.max(
    currentQuantity - 1,
    1,
  );
}

if (quantity === currentQuantity) {
  return;
}

const total =
  product.price * quantity;

    const stockText =
      product.stock > 0
        ? `🟢 ${product.stock} tersedia`
        : '🔴 Habis';

    const caption =
      '╭────────────────────────────╮\n' +
      '│ 📦 DETAIL PRODUK\n' +
      '├────────────────────────────╯\n' +
      '│\n' +
      `│ 🎯 ${product.name}\n` +
      '│\n' +
      '│ 💰 Harga\n' +
      `│    Rp${product.price.toLocaleString('id-ID')}\n` +
      '│\n' +
      '│ 📦 Stok\n' +
      `│    ${stockText}\n` +
      '│\n' +
      (
        product.description
          ? '│ 📝 Deskripsi\n' +
            `│    ${product.description}\n` +
            '│\n'
          : ''
      ) +
      '├────────────────────────────\n' +
      '│ 🔢 JUMLAH\n' +
      '│\n' +
      `│       [ − ]   ${quantity}   [ + ]\n` +
      '│\n' +
      '│ 💵 TOTAL\n' +
      `│    Rp${total.toLocaleString('id-ID')}\n` +
      '╰────────────────────────────╮\n' +
      'Silakan pilih tindakan di bawah.';

    const keyboard = [
      [
        {
          text: '−',
          callback_data:
            `catalog:qty:decrease:${product.id}:${quantity}:${page}`,
        },
        {
          text: `${quantity}`,
          callback_data: 'catalog:noop',
        },
        {
          text: '+',
          callback_data:
            `catalog:qty:increase:${product.id}:${quantity}:${page}`,
        },
      ],
      [
        {
  text: '🛒 Tambah ke Keranjang',
 callback_data:
  `cart:add:${product.id}:${quantity}`,
},
      ],
      [
        {
          text: '⬅️ Kembali ke Katalog',
          callback_data:
            `catalog:back:${page}`,
        },
      ],
    ];

    if (messageId) {
      if (product.photoFileId) {
        await this.telegramService.editMessageCaption(
          chatId,
          messageId,
          caption,
          undefined,
          keyboard,
        );
      } else {
        await this.telegramService.editMessageText(
          chatId,
          messageId,
          caption,
          undefined,
          keyboard,
        );
      }
    } else {
      await this.telegramService.sendMessage(
        chatId,
        caption,
        keyboard,
      );
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Gagal memperbarui jumlah produk.';

    this.logger.error(
      `Product quantity error: ${message}`,
    );

    await this.telegramService.sendMessage(
      chatId,
      `⚠️ ${message}`,
    );
  }
}

  private async handleRemoveItem(
    chatId: number,
    telegramUser: {
      id: number;
      first_name?: string;
      username?: string;
    },
    callbackData: string,
  ): Promise<void> {
    const productId = callbackData.substring(
      'cart:remove:'.length,
    );

    if (!productId) {
      await this.telegramService.sendMessage(
        chatId,
        '⚠️ Produk tidak valid.',
      );

      return;
    }

    try {
      const customer =
        await this.customerService.findOrCreateByTelegram(
          String(telegramUser.id),
          telegramUser.first_name,
          telegramUser.username,
        );

      await this.cartService.removeItem(
        customer.id,
        productId,
      );

      await this.handleCart(
        chatId,
        telegramUser,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal menghapus produk dari keranjang.';

      this.logger.error(
        `Remove cart item error: ${message}`,
      );

      await this.telegramService.sendMessage(
        chatId,
        `⚠️ ${message}`,
      );
    }
  }

 private async handlePaymentSelection(
  chatId: number,
): Promise<void> {
  await this.telegramService.sendMessage(
    chatId,
    '💳 PILIH METODE PEMBAYARAN\n\n' +
      'Silakan pilih metode pembayaran:',
    [
      [
        {
          text: '🟩 QRIS',
          callback_data: 'payment:qris',
        },
        {
          text: '📱 E-Wallet',
          callback_data:
            'payment:e_wallet',
        },
      ],
      [
        {
          text: '❌ Batal',
          callback_data:
            'checkout:cancel',
        },
      ],
    ],
  );
}

    private async handlePaymentMethod(
    chatId: number,
    telegramUser: {
      id: number;
      first_name?: string;
      username?: string;
    },
    paymentMethod: PaymentMethod,
  ): Promise<void> {
    this.checkoutStateService.setPaymentMethod(
      String(telegramUser.id),
      paymentMethod,
    );

    const labels: Record<
      PaymentMethod,
      string
    > = {
      CASH: '💵 Cash',
      BANK_TRANSFER: '🏦 Transfer Bank',
      E_WALLET: '📱 E-Wallet',
      QRIS: '🟩 QRIS',
      COD: '📦 COD',
    };

    await this.telegramService.sendMessage(
      chatId,
      `💳 METODE PEMBAYARAN\n\n` +
        `Pilihan: ${labels[paymentMethod]}\n\n` +
        'Metode pembayaran sudah dipilih.\n' +
        'Silakan konfirmasi pesanan kamu.',
     [
  [
    {
      text: '✅ Konfirmasi Pesanan',
      callback_data: 'checkout:confirm',
    },
  ],
  [
    {
      text: '🔄 Ubah Metode Pembayaran',
      callback_data: 'payment:select',
    },
  ],
  [
    {
      text: '❌ Batal',
      callback_data: 'checkout:cancel',
    },
  ],
]
    );
  }

  private async handleCheckoutConfirm(
    chatId: number,
    telegramUser: {
      id: number;
      first_name?: string;
      username?: string;
    },
  ): Promise<void> {
    try {
      const customer =
        await this.customerService.findOrCreateByTelegram(
          String(telegramUser.id),
          telegramUser.first_name,
          telegramUser.username,
        );

        const checkoutState =
        this.checkoutStateService.getState(
          String(telegramUser.id),
        );

        const promoCode =
        checkoutState?.promoCode;

        const paymentMethod =
        checkoutState?.paymentMethod;

        if (!paymentMethod) {
      await this.telegramService.sendMessage(
        chatId,
        '💳 Silakan pilih metode pembayaran terlebih dahulu.',
      );

      return;
    }

        const order =
  await this.orderService.createFromCart(
    customer.id,
    promoCode,
    paymentMethod,
  );

let paymentUrl: string | null = null;

if (
  paymentMethod === 'QRIS' ||
  paymentMethod === 'E_WALLET' ||
  paymentMethod === 'BANK_TRANSFER'
) {
  const snapPayment =
    await this.midtransPaymentService.createSnapTransaction(
      {
        orderId: order.orderNumber,
        grossAmount: Number(order.total),
        paymentMethod,
        itemDetails: order.items.map(
          (item) => ({
            id: item.productId,
            price: Number(item.unitPrice),
            quantity: item.quantity,
            name: item.product.name,
          }),
        ),
      },
    );

  paymentUrl = snapPayment.redirectUrl;
}

this.checkoutStateService.clear(
  String(telegramUser.id),
);

     if (paymentUrl) {
  await this.telegramService.sendMessage(
    chatId,
    `✅ PESANAN BERHASIL DIBUAT\n\n` +
      `🧾 Nomor Pesanan: ${order.orderNumber}\n` +
      `💰 Total: Rp${Number(
        order.total,
      ).toLocaleString('id-ID')}\n\n` +
      `📌 Status: MENUNGGU PEMBAYARAN\n\n` +
      `Silakan lanjutkan pembayaran melalui tombol di bawah. 💳`,
    [
      [
        {
          text: '💳 BAYAR SEKARANG',
          url: paymentUrl,
        },
      ],
    ],
  );
} else {
  await this.telegramService.sendMessage(
    chatId,
    `✅ PESANAN BERHASIL DIBUAT\n\n` +
      `🧾 Nomor Pesanan: ${order.orderNumber}\n` +
      `💰 Total: Rp${Number(
        order.total,
      ).toLocaleString('id-ID')}\n\n` +
      `📌 Status: ${order.status}\n\n` +
      `Terima kasih sudah berbelanja di NozTech Store 🛍️`,
  );
}
      this.checkoutStateService.clear(
        String(telegramUser.id),
      );

    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal membuat pesanan.';

      this.logger.error(
        `Checkout confirm error: ${message}`,
      );

      await this.telegramService.sendMessage(
        chatId,
        `⚠️ ${message}`,
      );
    }
  }

 private async handleCheckoutCancel(
  chatId: number,
  telegramUser: {
    id: number;
    first_name?: string;
    username?: string;
  },
): Promise<void> {
  this.checkoutStateService.clear(
    String(telegramUser.id),
  );

    await this.telegramService.sendMessage(
      chatId,
      '❌ Checkout dibatalkan.\n\n' +
        'Pesanan kamu tetap berada di keranjang.',
    );
  }

  private async handleCheckout(
    chatId: number,
    telegramUser: {
      id: number;
      first_name?: string;
      username?: string;
    },
  ): Promise<void> {
    try {
      const customer =
        await this.customerService.findOrCreateByTelegram(
          String(telegramUser.id),
          telegramUser.first_name,
          telegramUser.username,
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
          chatId,
          '🛒 KERANJANG\n\n' +
            'Keranjang kamu masih kosong.',
        );

        return;
      }

      let subtotal = 0;

      const lines: string[] = [
        '🧾 CHECKOUT',
        '',
      ];

      for (const item of cart.items) {
        const price = Number(
          item.product.price,
        );

        const itemSubtotal =
          price * item.quantity;

        subtotal += itemSubtotal;

        lines.push(
          `📦 ${item.product.name}`,
          `${item.quantity} × Rp${price.toLocaleString(
            'id-ID',
          )}`,
          `Subtotal: Rp${itemSubtotal.toLocaleString(
            'id-ID',
          )}`,
          '',
        );
      }

      lines.push(
        `💰 TOTAL: Rp${subtotal.toLocaleString(
          'id-ID',
        )}`,
        '',
        'Periksa kembali pesanan kamu sebelum melanjutkan.',
      );

      await this.telegramService.sendMessage(
        chatId,
        lines.join('\n'),
 [
  [
    {
      text: '🟩 QRIS',
      callback_data: 'payment:qris',
    },
    {
      text: '📱 E-Wallet',
      callback_data:
        'payment:e_wallet',
    },
  ],
  [
    {
      text: '❌ Batal',
      callback_data:
        'checkout:cancel',
    },
  ],
]
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal membuka checkout.';

      this.logger.error(
        `Checkout error: ${message}`,
      );

      await this.telegramService.sendMessage(
        chatId,
        `⚠️ ${message}`,
      );
    }
  }

  private async handleCart(
    chatId: number,
    telegramUser: {
      id: number;
      first_name?: string;
      username?: string;
    },
  ): Promise<void> {
    try {
      const customer =
        await this.customerService.findOrCreateByTelegram(
          String(telegramUser.id),
          telegramUser.first_name,
          telegramUser.username,
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
          chatId,
          '🛒 KERANJANG\n\n' +
            'Keranjang kamu masih kosong.',
        );

        return;
      }

      let total = 0;

      const lines: string[] = [
        '🛒 KERANJANG',
        '',
      ];

      const inlineKeyboard: {
        text: string;
        callback_data?: string;
      }[][] = [];

      for (const item of cart.items) {
        const price = Number(
          item.product.price,
        );

        const subtotal =
          price * item.quantity;

        total += subtotal;

        const formattedPrice =
          price.toLocaleString('id-ID');

        const formattedSubtotal =
          subtotal.toLocaleString('id-ID');

        lines.push(
          `📦 ${item.product.name}`,
          `${item.quantity} × Rp${formattedPrice}`,
          `Subtotal: Rp${formattedSubtotal}`,
          '',
        );

        inlineKeyboard.push([
          {
            text: '−',
            callback_data:
              `cart:decrease:${item.product.id}`,
          },
          {
            text: `${item.quantity}`,
            callback_data: 'cart:noop',
          },
          {
            text: '+',
            callback_data:
              `cart:increase:${item.product.id}`,
          },
        ]);

        inlineKeyboard.push([
          {
            text: '🗑 Hapus',
            callback_data:
              `cart:remove:${item.product.id}`,
          },
        ]);
      }

      lines.push(
        `💰 TOTAL: Rp${total.toLocaleString(
          'id-ID',
        )}`,
      );

      inlineKeyboard.push([
        {
          text: '💳 Checkout',
          callback_data: 'cart:checkout',
        },
      ]);

      await this.telegramService.sendMessage(
        chatId,
        lines.join('\n'),
        inlineKeyboard,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal mengambil isi keranjang.';

      this.logger.error(
        `View cart error: ${message}`,
      );

      await this.telegramService.sendMessage(
        chatId,
        `⚠️ ${message}`,
      );
    }
  }

  private async handleOrders(
    chatId: number,
    telegramUser: {
      id: number;
      first_name?: string;
      username?: string;
    },
  ): Promise<void> {
    try {
      const customer =
        await this.customerService.findOrCreateByTelegram(
          String(telegramUser.id),
          telegramUser.first_name,
          telegramUser.username,
        );

      const orders =
        await this.orderService.findByCustomerId(
          customer.id,
        );

      if (orders.length === 0) {
        await this.telegramService.sendMessage(
          chatId,
          '🧾 PESANAN SAYA\n\n' +
            'Kamu belum memiliki pesanan.',
        );

        return;
      }

     const lines: string[] = [
  '🧾 PESANAN SAYA',
  '',
  'Pilih pesanan untuk melihat detail:',
];

const keyboard = orders.map((order) => [
  {
    text: `🧾 ${order.orderNumber} — Rp${Number(
      order.total,
    ).toLocaleString('id-ID')}`,
    callback_data: `order:detail:${order.id}`,
  },
]);

keyboard.push([
  {
    text: '🔙 Kembali ke Menu',
    callback_data: 'menu:main',
  },
]);

await this.telegramService.sendMessage(
  chatId,
  lines.join('\n'),
  keyboard,
);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal mengambil pesanan.';

      this.logger.error(
        `Order history error: ${message}`,
      );

      await this.telegramService.sendMessage(
        chatId,
        `⚠️ ${message}`,
      );
    }
  }

    private async handleAccount(
    chatId: number,
    telegramUser: {
      id: number;
      first_name?: string;
      username?: string;
    },
  ): Promise<void> {
    try {
      const customer =
        await this.customerService.findOrCreateByTelegram(
          String(telegramUser.id),
          telegramUser.first_name,
          telegramUser.username,
        );

      const username =
        customer.telegramUsername
          ? `@${customer.telegramUsername}`
          : '-';

      const lines: string[] = [
        '👤 AKUN SAYA',
        '',
        `Nama: ${customer.name}`,
        `Username: ${username}`,
        `Telegram ID: ${customer.telegramId}`,
        '',
        'Status: AKTIF',
      ];

      await this.telegramService.sendMessage(
        chatId,
        lines.join('\n'),
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal mengambil data akun.';

      this.logger.error(
        `Account error: ${message}`,
      );

      await this.telegramService.sendMessage(
        chatId,
        `⚠️ ${message}`,
      );
    }
  }

  private async handleOrderDetail(
  chatId: number,

  telegramUser: {
    id: number;
    first_name?: string;
    username?: string;
  },
  orderId: string,
): Promise<void> {
  try {
    const customer =
      await this.customerService.findOrCreateByTelegram(
        String(telegramUser.id),
        telegramUser.first_name,
        telegramUser.username,
      );

    const orders =
      await this.orderService.findByCustomerId(
        customer.id,
      );

    const order = orders.find(
      (item) => item.id === orderId,
    );

    if (!order) {
      await this.telegramService.sendMessage(
        chatId,
        '⚠️ Pesanan tidak ditemukan.',
      );

      return;
    }

    const lines: string[] = [
      '🧾 DETAIL PESANAN',
      '',
      `🧾 Nomor: ${order.orderNumber}`,
      `📌 Status: ${order.status}`,
      '',
      '📦 PRODUK',
      '',
    ];

    for (const item of order.items) {
      const quantity = Number(item.quantity);
     const price = Number(item.product.price);
      const subtotal = quantity * price;

      lines.push(
        `📦 ${item.product.name}`,
        `${quantity} × Rp${price.toLocaleString('id-ID')}`,
        `Subtotal: Rp${subtotal.toLocaleString('id-ID')}`,
        '',
      );
    }

    lines.push(
      `💰 TOTAL: Rp${Number(
        order.total,
      ).toLocaleString('id-ID')}`,
      '',
    );

    if (order.payment) {
      lines.push(
        `💳 Pembayaran: ${order.payment.method}`,
        `💵 Status Pembayaran: ${order.payment.status}`,
      );
    }

   const buttons = [];

if (order.status === 'PENDING') {
  buttons.push([
    {
      text: '❌ Batalkan Pesanan',
      callback_data: `order:cancel:${order.id}`,
    },
  ]);
}

buttons.push([
  {
    text: '🔙 Kembali ke Pesanan Saya',
    callback_data: 'orders:open',
  },
]);

await this.telegramService.sendMessage(
  chatId,
  lines.join('\n'),
  buttons,
);

  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Gagal mengambil detail pesanan.';

    this.logger.error(
      `Order detail error: ${message}`,
    );

    await this.telegramService.sendMessage(
      chatId,
      `⚠️ ${message}`,
    );
  }
}

private async handleOrderCancel(
  chatId: number,
  telegramUser: {
    id: number;
    first_name?: string;
    username?: string;
  },
  callbackData: string,
): Promise<void> {
  try {
    const orderId = callbackData.substring(
      'order:cancel:'.length,
    );

    if (!orderId) {
      await this.telegramService.sendMessage(
        chatId,
        '⚠️ Pesanan tidak valid.',
      );

      return;
    }

    const customer =
      await this.customerService.findOrCreateByTelegram(
        String(telegramUser.id),
        telegramUser.first_name,
        telegramUser.username,
      );

    const orders =
      await this.orderService.findByCustomerId(
        customer.id,
      );

    const order = orders.find(
      (item) => item.id === orderId,
    );

    if (!order) {
      await this.telegramService.sendMessage(
        chatId,
        '⚠️ Pesanan tidak ditemukan.',
      );

      return;
    }

    if (order.status !== 'PENDING') {
      await this.telegramService.sendMessage(
        chatId,
        `⚠️ Pesanan dengan status ${order.status} tidak dapat dibatalkan.`,
      );

      return;
    }

    const cancelledOrder =
      await this.orderService.cancelOrder(
        order.id,
      );

    await this.telegramService.sendMessage(
      chatId,
      `❌ PESANAN DIBATALKAN\n\n` +
        `🧾 Nomor Pesanan: ${cancelledOrder.orderNumber}\n` +
        `📌 Status: ${cancelledOrder.status}\n\n` +
        'Stok produk telah dikembalikan.',
      [
        [
          {
            text: '📦 Pesanan Saya',
            callback_data: 'orders:open',
          },
        ],
        [
          {
            text: '🔙 Kembali ke Menu',
            callback_data: 'menu:main',
          },
        ],
      ],
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Gagal membatalkan pesanan.';

    this.logger.error(
      `Order cancel error: ${message}`,
    );

    await this.telegramService.sendMessage(
      chatId,
      `⚠️ ${message}`,
    );
  }
}

    private async handleHelp(
    chatId: number,
  ): Promise<void> {
    const lines: string[] = [
      '💬 BANTUAN',
      '',
      '🛍️ Katalog',
      'Lihat produk yang tersedia dan pilih produk untuk dibeli.',
      '',
      '🛒 Keranjang',
      'Lihat produk yang sudah dimasukkan ke keranjang.',
      '',
      '💳 Checkout',
      'Proses pembelian dari keranjang.',
      '',
      '📦 Pesanan Saya',
      'Melihat riwayat pesanan kamu.',
      '',
      '👤 Akun Saya',
      'Melihat informasi akun Telegram kamu.',
      '',
      '🔥 Promo',
      'Melihat promo yang tersedia.',
      '',
      'Butuh bantuan lebih lanjut?',
      'Silakan hubungi admin.',
    ];

    await this.telegramService.sendMessage(
      chatId,
      lines.join('\n'),
    );
  }

private async handlePlaceholder(
    chatId: number,
    title: string,
  ): Promise<void> {
    await this.telegramService.sendMessage(
      chatId,
      `${title}\n\n` +
        '🚧 Fitur ini sedang dalam tahap pengembangan.',
    );
  }

  private async handleAdminProductConfirm(
  chatId: number,
  telegramUserId: number,
): Promise<void> {
  const state =
    this.adminProductStateService.get(
      String(telegramUserId),
    );

  if (!state) {
    await this.telegramService.sendMessage(
      chatId,
      '⚠️ Sesi tambah produk tidak ditemukan.\n\n' +
        'Silakan mulai kembali dari Admin Panel.',
    );

    return;
  }

  if (
    state.step !== 'confirm' ||
    !state.name ||
    state.price === undefined ||
    !state.description ||
    !state.photoFileId ||
    !state.categoryId ||
    state.stock === undefined
  ) {
    await this.telegramService.sendMessage(
      chatId,
      '⚠️ Data produk belum lengkap.\n\n' +
        'Silakan ulangi proses tambah produk.',
    );

    this.adminProductStateService.clear(
      String(telegramUserId),
    );

    return;
  }

  try {
    const product =
      await this.productService.createProduct({
        name: state.name,
        price: state.price,
        description: state.description,
        photoFileId: state.photoFileId,
        categoryId: state.categoryId,
        stock: state.stock,
      });

    this.adminProductStateService.clear(
      String(telegramUserId),
    );

    await this.telegramService.sendMessage(
      chatId,
      '✅ PRODUK BERHASIL DITAMBAHKAN\n\n' +
        `📦 ${product.name}\n` +
        `🆔 SKU: ${product.sku}\n` +
        `💰 Harga: Rp${Number(
          product.price,
        ).toLocaleString('id-ID')}\n` +
        `📊 Stok: ${product.stock}\n` +
        `📂 Kategori: ${product.category.name}\n\n` +
        'Produk sekarang sudah masuk ke katalog.',
      [
        [
          {
            text: '📦 Daftar Produk',
            callback_data:
              'admin:product:list',
          },
        ],
        [
          {
            text: '🔐 Admin Panel',
            callback_data: 'admin:open',
          },
        ],
      ],
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Gagal menyimpan produk.';

    this.logger.error(
      `Admin product create error: ${message}`,
    );

    await this.telegramService.sendMessage(
      chatId,
      `⚠️ ${message}`,
    );
  }
}

private async handleAdminProductList(
  chatId: number,
): Promise<void> {
  try {
    const products =
      await this.productService.findAll();

    if (products.length === 0) {
      await this.telegramService.sendMessage(
        chatId,
        '📦 DAFTAR PRODUK\n\n' +
          'Belum ada produk.',
        [
          [
            {
              text: '🔙 Kembali ke Admin Panel',
              callback_data: 'admin:open',
            },
          ],
        ],
      );

      return;
    }

    const lines: string[] = [
      '📦 DAFTAR PRODUK',
      '',
    ];

    const keyboard = [];

    for (const product of products) {
      const price = Number(
        product.price,
      ).toLocaleString('id-ID');

      lines.push(
        `📦 ${product.name}`,
        `🆔 SKU: ${product.sku}`,
        `💰 Harga: Rp${price}`,
        `📊 Stok: ${product.stock}`,
        `📌 Status: ${product.status}`,
        '',
      );

      keyboard.push([
        {
          text: `✏️ Edit ${product.name}`,
          callback_data:
            `admin:product:edit:${product.id}`,
        },
      ]);
    }

    keyboard.push([
      {
        text: '🔙 Kembali ke Admin Panel',
        callback_data: 'admin:open',
      },
    ]);

    await this.telegramService.sendMessage(
      chatId,
      lines.join('\n').trim(),
      keyboard,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Gagal mengambil daftar produk.';

    this.logger.error(
      `Admin product list error: ${message}`,
    );

    await this.telegramService.sendMessage(
      chatId,
      `⚠️ ${message}`,
    );
  }
}
}