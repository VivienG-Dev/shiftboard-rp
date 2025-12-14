import { IsNotEmpty, IsString } from 'class-validator';

export class AddMemberRoleDto {
  @IsString()
  @IsNotEmpty()
  roleId!: string;
}

