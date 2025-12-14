import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ItemCategory } from '../../../generated/prisma/enums';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsEnum(ItemCategory)
  category!: ItemCategory;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  unit!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;
}

