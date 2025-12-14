import {
  ArrayMinSize,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateSnapshotLineDto {
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsInt()
  @Min(0)
  quantity!: number;
}

export class CreateSnapshotDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSnapshotLineDto)
  lines!: CreateSnapshotLineDto[];
}

