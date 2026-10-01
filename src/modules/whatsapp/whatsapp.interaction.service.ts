import {
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  WhatsAppInboundMessage,
  WhatsAppWebhookPayload,
} from './whatsapp.types';

@Injectable()
export class WhatsAppInteractionService {
  private readonly logger =
    new Logger(WhatsAppInteractionService.name);

  /**
   * Entry point untuk seluruh webhook WhatsApp.
   *
   * Untuk tahap awal kita hanya:
   * - menerima payload
   * - membaca message
   * - mengenali tipe pesan
   * - logging
   *
   * Business logic Product / Cart / Order / Payment
   * akan kita sambungkan setelah webhook dasar lolos.
   */
  async handleWebhook(
    payload: unknown,
  ): Promise<void> {
    const webhook =
      payload as WhatsAppWebhookPayload;

    if (!webhook.entry?.length) {
      this.logger.debug(
        'WhatsApp webhook tanpa entry.',
      );

      return;
    }

    for (const entry of webhook.entry) {
      if (!entry.changes?.length) {
        continue;
      }

      for (const change of entry.changes) {
        const value = change.value;

        if (!value?.messages?.length) {
          continue;
        }

        for (const message of value.messages) {
          await this.handleMessage(
            message,
            value.contacts?.[0]?.profile?.name,
          );
        }
      }
    }
  }

  /**
   * Memproses satu incoming message.
   */
  private async handleMessage(
    message: WhatsAppInboundMessage,
    profileName?: string,
  ): Promise<void> {
    const from = message.from;

    if (!from) {
      this.logger.warn(
        'WhatsApp message tanpa nomor pengirim.',
      );

      return;
    }

    this.logger.log(
      `WhatsApp message received | from=${from} | name=${profileName ?? '-'} | type=${message.type ?? '-'}`,
    );

    switch (message.type) {
      case 'text':
        this.logger.log(
          `WhatsApp text: ${message.text?.body ?? ''}`,
        );

        return;

      case 'interactive':
        if (
          message.interactive?.list_reply
        ) {
          this.logger.log(
            `WhatsApp list reply: ${message.interactive.list_reply.id ?? ''}`,
          );
        }

        if (
          message.interactive?.button_reply
        ) {
          this.logger.log(
            `WhatsApp button reply: ${message.interactive.button_reply.id ?? ''}`,
          );
        }

        return;

      case 'button':
        this.logger.log(
          `WhatsApp button: ${message.button?.payload ?? ''}`,
        );

        return;

      default:
        this.logger.log(
          `WhatsApp message type belum ditangani: ${message.type}`,
        );

        return;
    }
  }
}