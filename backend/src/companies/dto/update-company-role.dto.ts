import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength } from 'class-validator';
import type { PermissionKey } from '../../auth/permissions';

export class UpdateCompanyRoleDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  permissions?: PermissionKey[];
}

