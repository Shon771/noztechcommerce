import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  WhatsAppSendButtonsRequest,
  WhatsAppSendImageRequest,
  WhatsAppSendListRequest,
  WhatsAppSendTextRequest,
  WhatsAppReplyButton,
  WhatsAppListSection,
} from './whatsapp.types';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  private readonly graphApiVersion: string;
  private readonly phoneNumberId: string;
  private readonly accessToken: string;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.graphApiVersion =
      this.configService.get<string>(
        'WHATSAPP_GRAPH_API_VERSION',
      ) ?? '';

    this.phoneNumberId =
      this.configService.get<string>(
        'WHATSAPP_PHONE_NUMBER_ID',
      ) ?? '';

    this.accessToken =
      this.configService.get<string>(
        'WHATSAPP_ACCESS_TOKEN',
      ) ?? '';
  }

  /* =========================================================
   * CONFIG
   * ======================================================= */

  private get messagesUrl(): string {
    if (!this.graphApiVersion || !this.phoneNumberId) {
      throw new Error(
        'WhatsApp configuration belum lengkap: ' +
          'WHATSAPP_GRAPH_API_VERSION dan WHATSAPP_PHONE_NUMBER_ID wajib diisi.',
      );
    }

    return `https://graph.facebook.com/${this.graphApiVersion}/${this.phoneNumberId}/messages`;
  }

  private ensureAccessToken(): void {
    if (!this.accessToken) {
      throw new Error(
        'WHATSAPP_ACCESS_TOKEN belum diatur di environment.',
      );
    }
  }

  /* =========================================================
   * CORE HTTP REQUEST
   * ======================================================= */

  private async sendRequest(
    payload:
      | WhatsAppSendTextRequest
      | WhatsAppSendListRequest
      | WhatsAppSendButtonsRequest
      | WhatsAppSendImageRequest,
  ): Promise<unknown> {
    this.ensureAccessToken();

    try {
      const response = await fetch(this.messagesUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      let responseBody: unknown;

      try {
        responseBody = responseText
          ? JSON.parse(responseText)
          : null;
      } catch {
        responseBody = responseText;
      }

      if (!response.ok) {
        this.logger.error(
          `WhatsApp API error ${response.status}: ${responseText}`,
        );

        throw new Error(
          `WhatsApp API request gagal (${response.status}).`,
        );
      }

      this.logger.debug(
        `WhatsApp API success: ${response.status}`,
      );

      return responseBody;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      this.logger.error(
        `WhatsApp API request exception: ${message}`,
      );

      throw error;
    }
  }

  /* =========================================================
   * TEXT
   * ======================================================= */

  async sendText(
    to: string,
    body: string,
    previewUrl = false,
  ): Promise<unknown> {
    const payload: WhatsAppSendTextRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        preview_url: previewUrl,
        body,
      },
    };

    return this.sendRequest(payload);
  }

  /* =========================================================
   * LIST
   *
   * Digunakan untuk katalog vertikal:
   *
   * [1] Produk A
   * [2] Produk B
   * [3] Produk C
   * ...
   *
   * ID internal sebaiknya berupa callback ID,
   * misalnya:
   * product:<uuid>
   * ======================================================= */

  async sendList(
    to: string,
    body: string,
    buttonText: string,
    sections: WhatsAppListSection[],
    options?: {
      headerText?: string;
      footerText?: string;
    },
  ): Promise<unknown> {
    const payload: WhatsAppSendListRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',

        ...(options?.headerText
          ? {
              header: {
                type: 'text',
                text: options.headerText,
              },
            }
          : {}),

        body: {
          text: body,
        },

        ...(options?.footerText
          ? {
              footer: {
                text: options.footerText,
              },
            }
          : {}),

        action: {
          button: buttonText,
          sections,
        },
      },
    };

    return this.sendRequest(payload);
  }

  /* =========================================================
   * REPLY BUTTONS
   *
   * WhatsApp interactive button mendukung maksimal
   * beberapa tombol dalam satu pesan. Logic pemanggil
   * akan membatasi jumlah sesuai kebutuhan UI.
   * ======================================================= */

  async sendButtons(
    to: string,
    body: string,
    buttons: WhatsAppReplyButton[],
    footerText?: string,
  ): Promise<unknown> {
    if (buttons.length === 0) {
      throw new Error(
        'sendButtons membutuhkan minimal 1 tombol.',
      );
    }

    if (buttons.length > 3) {
      throw new Error(
        'sendButtons maksimal 3 tombol per pesan.',
      );
    }

    const payload: WhatsAppSendButtonsRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',

        body: {
          text: body,
        },

        ...(footerText
          ? {
              footer: {
                text: footerText,
              },
            }
          : {}),

        action: {
          buttons,
        },
      },
    };

    return this.sendRequest(payload);
  }

  /* =========================================================
   * IMAGE
   * ======================================================= */

  async sendImage(
    to: string,
    imageUrl: string,
    caption?: string,
  ): Promise<unknown> {
    const payload: WhatsAppSendImageRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'image',
      image: {
        link: imageUrl,
        ...(caption ? { caption } : {}),
      },
    };

    return this.sendRequest(payload);
  }
}