import type { CompanyType } from '../../generated/prisma/client';

export type CreateCompanyInput = {
  name: string;
  type?: CompanyType;
  bankBalance?: number;
};

export type CreateCompanyLocationInput = {
  name: string;
};
