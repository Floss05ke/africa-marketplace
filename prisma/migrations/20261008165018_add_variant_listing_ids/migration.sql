/*
  Warnings:

  - A unique constraint covering the columns `[listingId]` on the table `ProductVariant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `listingId` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ProductVariant_productId_sku_key";

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "listingId" TEXT NOT NULL,
ALTER COLUMN "sku" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_listingId_key" ON "ProductVariant"("listingId");

-- CreateIndex
CREATE INDEX "ProductVariant_sku_idx" ON "ProductVariant"("sku");
