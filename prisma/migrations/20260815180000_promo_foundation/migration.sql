-- CreateEnum
CREATE TYPE "PromoType" AS ENUM ('PERCENTAGE', 'FIXED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "promoId" TEXT;

-- CreateTable
CREATE TABLE "Promo" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "PromoType" NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "minOrderAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "maxDiscount" DECIMAL(15,2),
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Promo_code_key" ON "Promo"("code");

-- CreateIndex
CREATE INDEX "Promo_isActive_idx" ON "Promo"("isActive");

-- CreateIndex
CREATE INDEX "Promo_startsAt_idx" ON "Promo"("startsAt");

-- CreateIndex
CREATE INDEX "Promo_expiresAt_idx" ON "Promo"("expiresAt");

-- CreateIndex
CREATE INDEX "Promo_isActive_startsAt_expiresAt_idx" ON "Promo"("isActive", "startsAt", "expiresAt");

-- CreateIndex
CREATE INDEX "Order_promoId_idx" ON "Order"("promoId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "Promo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
