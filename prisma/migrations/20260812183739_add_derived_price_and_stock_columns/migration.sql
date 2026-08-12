-- DropIndex
DROP INDEX "Product_price_idx";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "effectivePrice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "inStock" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Product_effectivePrice_idx" ON "Product"("effectivePrice");

-- CreateIndex
CREATE INDEX "Product_inStock_idx" ON "Product"("inStock");
