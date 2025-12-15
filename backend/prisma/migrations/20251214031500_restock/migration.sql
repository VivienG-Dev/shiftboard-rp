-- CreateTable
CREATE TABLE "restock" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "restock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restock_line" (
    "id" TEXT NOT NULL,
    "restockId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantityAdded" INTEGER NOT NULL,

    CONSTRAINT "restock_line_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "restock_companyId_createdAt_idx" ON "restock"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "restock_createdById_idx" ON "restock"("createdById");

-- CreateIndex
CREATE INDEX "restock_line_itemId_idx" ON "restock_line"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "restock_line_restockId_itemId_key" ON "restock_line"("restockId", "itemId");

-- AddForeignKey
ALTER TABLE "restock" ADD CONSTRAINT "restock_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restock" ADD CONSTRAINT "restock_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restock_line" ADD CONSTRAINT "restock_line_restockId_fkey" FOREIGN KEY ("restockId") REFERENCES "restock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restock_line" ADD CONSTRAINT "restock_line_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
