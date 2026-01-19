import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ItemCategory } from '../../../generated/prisma/enums';

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEnum(ItemCategory)
  category?: ItemCategory;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
