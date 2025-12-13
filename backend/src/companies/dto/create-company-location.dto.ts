import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCompanyLocationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}
