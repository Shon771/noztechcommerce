-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('PENDING', 'WAITING_SUPPLIER', 'PURCHASING', 'SUPPLIER_DELIVERED', 'DELIVERED', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "soldCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "DigitalProduct" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "deliveryUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierProduct" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fulfillment" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "status" "FulfillmentStatus" NOT NULL DEFAULT 'PENDING',
    "supplierName" TEXT,
    "supplierOrderId" TEXT,
    "supplierCost" DECIMAL(15,2),
    "deliveryUrl" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fulfillment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DigitalProduct_productId_key" ON "DigitalProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierProduct_productId_key" ON "SupplierProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Fulfillment_orderItemId_key" ON "Fulfillment"("orderItemId");

-- CreateIndex
CREATE INDEX "Fulfillment_status_idx" ON "Fulfillment"("status");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalProduct" ADD CONSTRAINT "DigitalProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fulfillment" ADD CONSTRAINT "Fulfillment_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
