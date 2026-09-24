import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PromoService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findByCode(code: string) {
    return this.prisma.promo.findUnique({
      where: {
        code,
      },
    });
  }

  async validatePromo(
    code: string,
    subtotal: number,
  ) {
    const promo = await this.findByCode(code);

    if (!promo) {
      return {
        valid: false,
        message: 'Kode promo tidak ditemukan.',
      };
    }

    const now = new Date();

    if (!promo.isActive) {
      return {
        valid: false,
        message: 'Promo sedang tidak aktif.',
      };
    }

    if (now < promo.startsAt) {
      return {
        valid: false,
        message: 'Promo belum mulai.',
      };
    }

    if (now > promo.expiresAt) {
      return {
        valid: false,
        message: 'Promo sudah berakhir.',
      };
    }

    if (subtotal < Number(promo.minOrderAmount)) {
      return {
        valid: false,
        message: `Minimum pembelian untuk promo ini adalah Rp${Number(
          promo.minOrderAmount,
        ).toLocaleString('id-ID')}.`,
      };
    }

    if (
      promo.usageLimit !== null &&
      promo.usageCount >= promo.usageLimit
    ) {
      return {
        valid: false,
        message: 'Kuota penggunaan promo sudah habis.',
      };
    }

    return {
      valid: true,
      promo,
      message: 'Promo valid.',
    };
  }

  calculateDiscount(
    promo: {
      type: 'PERCENTAGE' | 'FIXED';
      value: unknown;
      maxDiscount: unknown;
    },
    subtotal: number,
  ): number {
    if (subtotal <= 0) {
      return 0;
    }

    const value = Number(promo.value);

    const maxDiscount =
      promo.maxDiscount !== null
        ? Number(promo.maxDiscount)
        : null;

    let discount: number;

    if (promo.type === 'PERCENTAGE') {
      discount = subtotal * (value / 100);

      if (maxDiscount !== null) {
        discount = Math.min(
          discount,
          maxDiscount,
        );
      }
    } else {
      discount = value;
    }

    return Math.min(
      Math.max(discount, 0),
      subtotal,
    );
  }

    async incrementUsage(
    promoId: string,
  ) {
    const promo =
      await this.prisma.promo.findUnique({
        where: {
          id: promoId,
        },
        select: {
          id: true,
          usageLimit: true,
          usageCount: true,
        },
      });

    if (!promo) {
      return {
        success: false,
        message: 'Promo tidak ditemukan.',
      };
    }

    const updatedPromo =
      await this.prisma.$queryRaw<
        Array<{
          id: string;
          usageCount: number;
          usageLimit: number | null;
        }>
      >`
        UPDATE "Promo"
        SET
          "usageCount" = "usageCount" + 1,
          "updatedAt" = NOW()
        WHERE
          "id" = ${promoId}
          AND (
            "usageLimit" IS NULL
            OR "usageCount" < "usageLimit"
          )
        RETURNING
          "id",
          "usageCount",
          "usageLimit";
      `;

    if (updatedPromo.length === 0) {
      return {
        success: false,
        message:
          'Kuota penggunaan promo sudah habis.',
      };
    }

    return {
      success: true,
      promo: updatedPromo[0],
    };
  }
}