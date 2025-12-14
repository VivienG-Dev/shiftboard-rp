import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength, Matches } from 'class-validator';
import type { PermissionKey } from '../../auth/permissions';

export class CreateCompanyRoleDto {
  @IsString()
  @MaxLength(60)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[a-z0-9_-]+$/)
  key?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  permissions?: PermissionKey[];
}

