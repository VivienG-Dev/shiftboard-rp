import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateMyMembershipDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  activeRoleId?: string;
}

