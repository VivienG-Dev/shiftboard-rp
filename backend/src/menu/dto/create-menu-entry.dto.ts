import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateMenuEntryDto {
  @IsOptional()
  @IsString()
  itemId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}
