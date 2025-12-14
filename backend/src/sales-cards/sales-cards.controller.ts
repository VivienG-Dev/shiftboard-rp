import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import type { SalesCardStatus } from '../../generated/prisma/client';
import { StartSalesCardDto } from './dto/start-sales-card.dto';
import { StopSalesCardDto } from './dto/stop-sales-card.dto';
import { UpdateSalesCardDto } from './dto/update-sales-card.dto';
import { SalesCardsService } from './sales-cards.service';

@Controller('companies/:companyId/sales-cards')
export class SalesCardsController {
  constructor(private readonly salesCardsService: SalesCardsService) {}

  @Get()
  async listSalesCards(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Query('status') status?: SalesCardStatus,
    @Query('userId') userId?: string,
  ) {
    return {
      data: await this.salesCardsService.listSalesCards(session.user.id, companyId, {
        status,
        userId,
      }),
    };
  }

  @Post('start')
  async startSalesCard(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Body() body: StartSalesCardDto,
  ) {
    return { data: await this.salesCardsService.startSalesCard(session.user.id, companyId, body) };
  }

  @Get(':cardId')
  async getSalesCard(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Param('cardId') cardId: string,
  ) {
    return { data: await this.salesCardsService.getSalesCard(session.user.id, companyId, cardId) };
  }

  @Patch(':cardId')
  async updateSalesCard(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Param('cardId') cardId: string,
    @Body() body: UpdateSalesCardDto,
  ) {
    return { data: await this.salesCardsService.updateSalesCard(session.user.id, companyId, cardId, body) };
  }

  @Post(':cardId/stop')
  async stopSalesCard(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Param('cardId') cardId: string,
    @Body() body: StopSalesCardDto,
  ) {
    return { data: await this.salesCardsService.stopSalesCard(session.user.id, companyId, cardId, body) };
  }
}

