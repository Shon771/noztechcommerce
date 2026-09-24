import { Injectable } from '@nestjs/common';
import { TelegramService } from '../telegram.service';

@Injectable()
export class AdminHandler {
  constructor(
    private readonly telegramService: TelegramService,
  ) {}

  async show(
    chatId: number,
  ): Promise<void> {
   const message =
  '🔐 NOZTECH COMMERCE ADMIN PANEL\n\n' +
  'Pilih menu admin:';
  const keyboard = [
  [
    {
      text: '➕ Tambah Produk',
      callback_data: 'admin:product:add',
    },
  ],
  [
    {
      text: '📦 Daftar Produk',
      callback_data: 'admin:product:list',
    },
  ],
  [
    {
      text: '🧾 Pesanan Supplier',
      callback_data: 'admin:supplier-orders',
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