import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import type { SalesCardStatus } from '../../generated/prisma/client';
import { StartSalesCardDto } from './dto/start-sales-card.dto';
import { StopSalesCardDto } from './dto/stop-sales-card.dto';
import { UpdateSalesCardDto } from './dto/update-sales-card.dto';
import { SalesCardsService } from './sales-cards.service';
import { RequireAnyPermissions, RequirePermissions } from '../auth/permissions.decorator';

@Controller('companies/:companyId/sales-cards')
export class SalesCardsController {
  constructor(private readonly salesCardsService: SalesCardsService) {}

  @Get()
  @RequirePermissions('salesCards.read')
  async listSalesCards(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: SalesCardStatus,
    @Query('userId') userId?: string,
  ) {
    return {
      data: await this.salesCardsService.listSalesCards(session.user.id, companyId, {
        from,
        to,
        status,
        userId,
      }),
    };
  }

  @Get('active')
  @RequirePermissions('salesCards.read')
  async getActiveSalesCard(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
  ) {
    return { data: await this.salesCardsService.getActiveSalesCard(session.user.id, companyId) };
  }

  @Post('start')
  @RequirePermissions('salesCards.create')
  async startSalesCard(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Body() body: StartSalesCardDto,
  ) {
    return { data: await this.salesCardsService.startSalesCard(session.user.id, companyId, body) };
  }

  @Get(':cardId')
  @RequirePermissions('salesCards.read')
  async getSalesCard(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Param('cardId') cardId: string,
  ) {
    return { data: await this.salesCardsService.getSalesCard(session.user.id, companyId, cardId) };
  }

  @Patch(':cardId')
  @RequireAnyPermissions('salesCards.edit.ownDraft', 'salesCards.edit.anyUnlocked')
  async updateSalesCard(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Param('cardId') cardId: string,
    @Body() body: UpdateSalesCardDto,
  ) {
    return { data: await this.salesCardsService.updateSalesCard(session.user.id, companyId, cardId, body) };
  }

  @Post(':cardId/stop')
  @RequireAnyPermissions('salesCards.stop.ownDraft', 'salesCards.stop.anyDraft')
  async stopSalesCard(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Param('cardId') cardId: string,
    @Body() body: StopSalesCardDto,
  ) {
    return { data: await this.salesCardsService.stopSalesCard(session.user.id, companyId, cardId, body) };
  }

  @Post(':cardId/lock')
  @RequirePermissions('salesCards.lock')
  async lockSalesCard(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Param('cardId') cardId: string,
  ) {
    return { data: await this.salesCardsService.lockSalesCard(session.user.id, companyId, cardId) };
  }
}
