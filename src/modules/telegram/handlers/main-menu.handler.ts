import { Injectable } from '@nestjs/common';
import { TelegramService } from '../telegram.service';

@Injectable()
export class MainMenuHandler {
  constructor(
    private readonly telegramService: TelegramService,
  ) {}

  async show(
    chatId: number,
    firstName?: string,
  ): Promise<void> {
    const name = firstName ? ` ${firstName}` : '';

    const message =
      `👋 Halo${name}!\n\n` +
      `Selamat datang di NozTech Store 🛍️\n\n` +
      `Belanja mudah, cepat, dan nyaman.\n\n` +
      `Silakan pilih menu di bawah:`;

    const keyboard = [
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
    ];

    await this.telegramService.sendMessage(
      chatId,
      message,
      keyboard,
    );
  }
}