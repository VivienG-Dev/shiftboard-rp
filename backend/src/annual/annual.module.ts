import { Module } from '@nestjs/common';
import { AnnualController } from './annual.controller';
import { AnnualService } from './annual.service';

@Module({
  controllers: [AnnualController],
  providers: [AnnualService],
})
export class AnnualModule {}
