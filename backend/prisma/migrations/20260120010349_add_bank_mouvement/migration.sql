-- CreateEnum
CREATE TYPE "CompanyBankMovementType" AS ENUM ('RESTOCK', 'SALES_CARD', 'MANUAL');

-- CreateTable
CREATE TABLE "company_bank_movement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "CompanyBankMovementType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "restockId" TEXT,
    "salesCardId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_bank_movement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_bank_movement_companyId_createdAt_idx" ON "company_bank_movement"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "company_bank_movement_restockId_idx" ON "company_bank_movement"("restockId");

-- CreateIndex
CREATE INDEX "company_bank_movement_salesCardId_idx" ON "company_bank_movement"("salesCardId");

-- AddForeignKey
ALTER TABLE "company_bank_movement" ADD CONSTRAINT "company_bank_movement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_bank_movement" ADD CONSTRAINT "company_bank_movement_restockId_fkey" FOREIGN KEY ("restockId") REFERENCES "restock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_bank_movement" ADD CONSTRAINT "company_bank_movement_salesCardId_fkey" FOREIGN KEY ("salesCardId") REFERENCES "sales_card"("id") ON DELETE SET NULL ON UPDATE CASCADE;
