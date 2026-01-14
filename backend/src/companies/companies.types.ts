import type { CompanyType } from '../../generated/prisma/client';

export type CreateCompanyInput = {
  name: string;
  type?: CompanyType;
};

export type CreateCompanyLocationInput = {
  name: string;
};
