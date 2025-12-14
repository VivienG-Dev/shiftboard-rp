import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateMemberDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  activeRoleId?: string;
}

