import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CompanyType } from '../../../generated/prisma/enums';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  slug?: string | null;

  @IsOptional()
  @IsEnum(CompanyType)
  type?: CompanyType;
}

