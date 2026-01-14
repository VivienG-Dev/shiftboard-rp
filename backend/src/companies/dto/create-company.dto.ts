import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CompanyType } from '../../../generated/prisma/enums';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsEnum(CompanyType)
  type?: CompanyType;
}
