import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
export type MidtransPaymentMethod =
  | 'BANK_TRANSFER'
  | 'E_WALLET'
  | 'QRIS';
@Injectable()
export class MidtransPaymentService {
  private readonly baseUrl =
    process.env.NODE_ENV === 'production'
    ? 'https://app.midtrans.com'
    : 'https://app.sandbox.midtrans.com';

   private mapPaymentMethod(
    method: MidtransPaymentMethod,
  ): string[] {
    switch (method) {
      case 'QRIS':
        return ['other_qris'];

      case 'E_WALLET':
        return [
          'gopay',
          'ovo',
          'dana',
          'shopeepay',
        ];

      case 'BANK_TRANSFER':
        return ['bank_transfer'];

      default:
        throw new Error(
          `Metode pembayaran "${method}" belum didukung Midtrans.`,
        );
    }
  }

  private getServerKey(): string {
    const serverKey =
      process.env.MIDTRANS_SERVER_KEY;

    if (!serverKey) {
      throw new InternalServerErrorException(
        'MIDTRANS_SERVER_KEY belum dikonfigurasi.',
      );
    }

    return serverKey;
  }

  async createSnapTransaction(data: {
  orderId: string;
  grossAmount: number;
  paymentMethod: MidtransPaymentMethod;
  itemDetails?: Array<{
      id: string;
      price: number;
      quantity: number;
      name: string;
    }>;
  }) {
    const serverKey = this.getServerKey();

const enabledPayments =
  this.mapPaymentMethod(
    data.paymentMethod,
  );

    try {
      const response = await axios.post(
        `${this.baseUrl}/snap/v1/transactions`,
        {
          transaction_details: {
            order_id: data.orderId,
            gross_amount: data.grossAmount,
          },

enabled_payments:
  enabledPayments,

          ...(data.itemDetails?.length
            ? {
                item_details: data.itemDetails,
              }
            : {}),
          payment_methods: this.mapPaymentMethod(data.paymentMethod),
        },
        {
          auth: {
            username: serverKey,
            password: '',
          },
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        token: response.data.token,
        redirectUrl: response.data.redirect_url,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const detail =
          typeof error.response?.data === 'string'
            ? error.response.data
            : JSON.stringify(
                error.response?.data ?? {},
              );

        throw new InternalServerErrorException(
          `Midtrans API error: ${detail}`,
        );
      }

      throw error;
    }
  }
}