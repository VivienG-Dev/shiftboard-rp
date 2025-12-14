import { IsISO8601, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class StartSalesCardDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  roleId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  locationId?: string;

  @IsOptional()
  @IsISO8601()
  startAt?: string;
}
