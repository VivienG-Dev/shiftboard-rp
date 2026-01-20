-- CreateTable
CREATE TABLE "annual_entry" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "revenue" DECIMAL(12,2),
    "expenses" DECIMAL(12,2),
    "startingCapital" DECIMAL(12,2),
    "total" DECIMAL(12,2),
    "itemsSold" INTEGER,
    "profit" DECIMAL(12,2),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annual_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "annual_entry_companyId_date_idx" ON "annual_entry"("companyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "annual_entry_companyId_date_key" ON "annual_entry"("companyId", "date");

-- AddForeignKey
ALTER TABLE "annual_entry" ADD CONSTRAINT "annual_entry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
