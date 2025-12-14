import { IsISO8601, IsOptional } from 'class-validator';

export class StopSalesCardDto {
  @IsOptional()
  @IsISO8601()
  endAt?: string;
}

