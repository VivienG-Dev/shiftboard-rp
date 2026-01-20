import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAnnualEntryDto {
  @IsDateString()
  date!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  revenue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  expenses?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  startingCapital?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  total?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  itemsSold?: number;

  @IsOptional()
  @IsNumber()
  profit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-14 * 60)
  @Max(14 * 60)
  tzOffsetMinutes?: number;
}
