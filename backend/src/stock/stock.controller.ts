import { Controller, Get, Param } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { StockService } from './stock.service';

@Controller('companies/:companyId/stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  async getStock(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
  ) {
    return { data: await this.stockService.getStock(session.user.id, companyId) };
  }
}

