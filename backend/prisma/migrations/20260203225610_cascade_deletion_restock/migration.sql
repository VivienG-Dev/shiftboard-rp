-- DropForeignKey
ALTER TABLE "company_bank_movement" DROP CONSTRAINT "company_bank_movement_restockId_fkey";

-- AddForeignKey
ALTER TABLE "company_bank_movement" ADD CONSTRAINT "company_bank_movement_restockId_fkey" FOREIGN KEY ("restockId") REFERENCES "restock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
