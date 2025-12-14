import { IsEmail, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateInviteDto {
  @IsEmail()
  email!: string;

  @IsString()
  roleId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  expiresInHours?: number;
}

