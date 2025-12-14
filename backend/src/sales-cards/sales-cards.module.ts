import { Module } from '@nestjs/common';
import { SalesCardsController } from './sales-cards.controller';
import { SalesCardsService } from './sales-cards.service';

@Module({
  controllers: [SalesCardsController],
  providers: [SalesCardsService],
})
export class SalesCardsModule {}

