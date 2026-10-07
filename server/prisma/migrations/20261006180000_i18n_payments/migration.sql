-- AlterTable
ALTER TABLE "Banner" ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'CZK',
ADD COLUMN     "exchangeRate" DECIMAL(12,6) NOT NULL DEFAULT 1,
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'cs',
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentType" TEXT NOT NULL DEFAULT 'bank',
ADD COLUMN     "pickupPoint" TEXT,
ADD COLUMN     "stripeSessionId" TEXT;

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "RecipeIngredient" ADD COLUMN     "translations" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeSessionId_key" ON "Order"("stripeSessionId");

