-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('BAR', 'CLUB', 'FAST_FOOD', 'OTHER');

-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('DRINK', 'BOTTLE', 'FOOD', 'OTHER');

-- CreateEnum
CREATE TYPE "SalesCardStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'LOCKED');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InviteType" AS ENUM ('EMAIL_CODE');

-- CreateTable
CREATE TABLE "company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "type" "CompanyType" NOT NULL DEFAULT 'OTHER',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "activeRoleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_role" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "permissions" TEXT[],
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "company_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_role" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ItemCategory" NOT NULL DEFAULT 'OTHER',
    "unit" TEXT NOT NULL,
    "basePrice" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_snapshot" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "inventory_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_snapshot_line" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "inventory_snapshot_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_card" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "status" "SalesCardStatus" NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_card_line" (
    "id" TEXT NOT NULL,
    "salesCardId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantitySold" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2),
    "total" DECIMAL(10,2),

    CONSTRAINT "sales_card_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "InviteType" NOT NULL DEFAULT 'EMAIL_CODE',
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "acceptedById" TEXT,

    CONSTRAINT "invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_ownerId_idx" ON "company"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "company_slug_key" ON "company"("slug");

-- CreateIndex
CREATE INDEX "membership_companyId_idx" ON "membership"("companyId");

-- CreateIndex
CREATE INDEX "membership_userId_idx" ON "membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "membership_userId_companyId_key" ON "membership"("userId", "companyId");

-- CreateIndex
CREATE INDEX "company_role_companyId_idx" ON "company_role"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "company_role_companyId_key_key" ON "company_role"("companyId", "key");

-- CreateIndex
CREATE INDEX "membership_role_roleId_idx" ON "membership_role"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "membership_role_membershipId_roleId_key" ON "membership_role"("membershipId", "roleId");

-- CreateIndex
CREATE INDEX "item_companyId_idx" ON "item"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "item_companyId_name_key" ON "item"("companyId", "name");

-- CreateIndex
CREATE INDEX "inventory_snapshot_companyId_createdAt_idx" ON "inventory_snapshot"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "inventory_snapshot_createdById_idx" ON "inventory_snapshot"("createdById");

-- CreateIndex
CREATE INDEX "inventory_snapshot_line_itemId_idx" ON "inventory_snapshot_line"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_snapshot_line_snapshotId_itemId_key" ON "inventory_snapshot_line"("snapshotId", "itemId");

-- CreateIndex
CREATE INDEX "sales_card_companyId_startAt_idx" ON "sales_card"("companyId", "startAt");

-- CreateIndex
CREATE INDEX "sales_card_companyId_userId_status_idx" ON "sales_card"("companyId", "userId", "status");

-- CreateIndex
CREATE INDEX "sales_card_roleId_idx" ON "sales_card"("roleId");

-- CreateIndex
CREATE INDEX "sales_card_line_itemId_idx" ON "sales_card_line"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_card_line_salesCardId_itemId_key" ON "sales_card_line"("salesCardId", "itemId");

-- CreateIndex
CREATE INDEX "invite_companyId_status_idx" ON "invite"("companyId", "status");

-- CreateIndex
CREATE INDEX "invite_createdById_idx" ON "invite"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "invite_code_key" ON "invite"("code");

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_role" ADD CONSTRAINT "company_role_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_role" ADD CONSTRAINT "membership_role_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_role" ADD CONSTRAINT "membership_role_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "company_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_snapshot" ADD CONSTRAINT "inventory_snapshot_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_snapshot" ADD CONSTRAINT "inventory_snapshot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_snapshot_line" ADD CONSTRAINT "inventory_snapshot_line_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "inventory_snapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_snapshot_line" ADD CONSTRAINT "inventory_snapshot_line_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_card" ADD CONSTRAINT "sales_card_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_card" ADD CONSTRAINT "sales_card_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_card" ADD CONSTRAINT "sales_card_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "company_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_card_line" ADD CONSTRAINT "sales_card_line_salesCardId_fkey" FOREIGN KEY ("salesCardId") REFERENCES "sales_card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_card_line" ADD CONSTRAINT "sales_card_line_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite" ADD CONSTRAINT "invite_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite" ADD CONSTRAINT "invite_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "company_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite" ADD CONSTRAINT "invite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite" ADD CONSTRAINT "invite_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
