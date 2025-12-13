-- CreateTable
CREATE TABLE "company_location" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "company_location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_location_companyId_idx" ON "company_location"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "company_location_companyId_name_key" ON "company_location"("companyId", "name");

-- AddForeignKey
ALTER TABLE "company_location" ADD CONSTRAINT "company_location_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
