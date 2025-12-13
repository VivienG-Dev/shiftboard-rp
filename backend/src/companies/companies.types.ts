import type { CompanyType } from '../../generated/prisma/client';

export type CreateCompanyInput = {
  name: string;
  slug?: string;
  type?: CompanyType;
};
