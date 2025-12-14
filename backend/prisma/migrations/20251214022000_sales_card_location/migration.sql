-- AlterTable
ALTER TABLE "sales_card" ADD COLUMN     "locationId" TEXT;

-- CreateIndex
CREATE INDEX "sales_card_locationId_idx" ON "sales_card"("locationId");

-- AddForeignKey
ALTER TABLE "sales_card" ADD CONSTRAINT "sales_card_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "company_location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
