-- CreateTable
CREATE TABLE "menu_entry" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "itemId" TEXT,
    "name" TEXT,
    "price" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "menu_entry_companyId_idx" ON "menu_entry"("companyId");

-- CreateIndex
CREATE INDEX "menu_entry_itemId_idx" ON "menu_entry"("itemId");

-- AddForeignKey
ALTER TABLE "menu_entry" ADD CONSTRAINT "menu_entry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_entry" ADD CONSTRAINT "menu_entry_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
