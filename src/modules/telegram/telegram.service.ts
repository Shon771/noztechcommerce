import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'fs';
import FormData from 'form-data';
interface TelegramApiResponse<T> {
  ok: boolean;
  result: T;
  description?: string;
}

interface TelegramUpdate {
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
}
interface TelegramInlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

@Injectable()
export class TelegramService {
  private readonly apiBaseUrl =
    'https://api.telegram.org/bot';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private getToken(): string {
    const token =
      this.configService.get<string>(
        'TELEGRAM_BOT_TOKEN',
      );

    if (!token) {
      throw new Error(
        'TELEGRAM_BOT_TOKEN is not configured',
      );
    }

    return token;
  }

  private getApiUrl(method: string): string {
    return `${this.apiBaseUrl}${this.getToken()}/${method}`;
  }

  async getMe() {
    const response =
      await this.httpService.axiosRef.get(
        this.getApiUrl('getMe'),
      );

    return response.data;
  }

 async getUpdates(
  offset?: number,
): Promise<
  TelegramApiResponse<TelegramUpdate[]>
> {
  const response =
    await this.httpService.axiosRef.get(
      this.getApiUrl('getUpdates'),
      {
        params: {
          offset,
          timeout: 25,
          allowed_updates: [
            'message',
            'callback_query',
          ],
        },
        timeout: 30000,
      },
    );

  return response.data;
}

   async sendMessage(
    chatId: number,
    text: string,
    inlineKeyboard?: TelegramInlineKeyboardButton[][],
    parseMode?: 'HTML' | 'MarkdownV2',
  ) {
    const response =
      await this.httpService.axiosRef.post(
        this.getApiUrl('sendMessage'),
        {
          chat_id: chatId,
          text,
          ...(inlineKeyboard
            ? {
                reply_markup: {
                  inline_keyboard:
                    inlineKeyboard,
                },
              }
            : {}),

                      ...(parseMode
            ? {
                parse_mode: parseMode,
              }
            : {}),
        },
      );

    return response.data;
  }

    async editMessageText(
  chatId: number,
  messageId: number,
  text: string,
  parseMode?: 'HTML' | 'MarkdownV2',
  inlineKeyboard?: TelegramInlineKeyboardButton[][],
) {
  const response =
    await this.httpService.axiosRef.post(
      this.getApiUrl(
        'editMessageText',
      ),
      {
        chat_id: chatId,
        message_id: messageId,
        text,

        ...(parseMode
          ? {
              parse_mode:
                parseMode,
            }
          : {}),

        ...(inlineKeyboard
          ? {
              reply_markup: {
                inline_keyboard:
                  inlineKeyboard,
              },
            }
          : {}),
      },
    );

  return response.data;
}

async editMessageCaption(
  chatId: number,
  messageId: number,
  caption: string,
  parseMode?: 'HTML' | 'MarkdownV2',
  inlineKeyboard?: TelegramInlineKeyboardButton[][],
) {
  const response =
    await this.httpService.axiosRef.post(
      this.getApiUrl(
        'editMessageCaption',
      ),
      {
        chat_id: chatId,
        message_id: messageId,
        caption,

        ...(parseMode
          ? {
              parse_mode:
                parseMode,
            }
          : {}),

        ...(inlineKeyboard
          ? {
              reply_markup: {
                inline_keyboard:
                  inlineKeyboard,
              },
            }
          : {}),
      },
    );

  return response.data;
}

 async sendPhoto(
  chatId: number,
  photo: string,
  caption?: string,
  inlineKeyboard?: TelegramInlineKeyboardButton[][],
) {
  const response =
    await this.httpService.axiosRef.post(
      this.getApiUrl('sendPhoto'),
      {
        chat_id: chatId,
        photo,
        ...(caption
          ? {
              caption,
            }
          : {}),
        ...(inlineKeyboard
          ? {
              reply_markup: {
                inline_keyboard:
                  inlineKeyboard,
              },
            }
          : {}),
      },
    );

  return response.data;
}

    async sendAnimation(
    chatId: number,
    filePath: string,
    caption?: string,
  ) {
    const form = new FormData();

    form.append('chat_id', String(chatId));
    form.append(
      'animation',
      createReadStream(filePath),
    );

    if (caption) {
      form.append('caption', caption);
    }

    const response =
      await this.httpService.axiosRef.post(
        this.getApiUrl('sendAnimation'),
        form,
        {
          headers: form.getHeaders(),
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        },
      );

    return response.data;
  }

    async deleteMessage(
    chatId: number,
    messageId: number,
  ) {
    const response =
      await this.httpService.axiosRef.post(
        this.getApiUrl('deleteMessage'),
        {
          chat_id: chatId,
          message_id: messageId,
        },
      );

    return response.data;
  }

  async answerCallbackQuery(
    callbackQueryId: string,
    text?: string,
  ) {
    const response =
      await this.httpService.axiosRef.post(
        this.getApiUrl(
          'answerCallbackQuery',
        ),
        {
          callback_query_id:
            callbackQueryId,
          ...(text ? { text } : {}),
        },
      );

    return response.data;
  }
}