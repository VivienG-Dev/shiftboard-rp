-- AlterTable
ALTER TABLE "company" ADD COLUMN     "bankBalance" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "item" ADD COLUMN     "costPrice" DECIMAL(10,2);
