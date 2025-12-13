-- AddUniqueConstraint
CREATE UNIQUE INDEX "company_ownerId_name_key" ON "company"("ownerId", "name");
