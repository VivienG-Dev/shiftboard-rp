import { Controller, Get, Param, Query } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { KpisService } from './kpis.service';
import { RequirePermissions } from '../auth/permissions.decorator';

@Controller('companies/:companyId/kpis')
export class KpisController {
  constructor(private readonly kpisService: KpisService) {}

  @Get()
  @RequirePermissions('stats.read')
  async getKpis(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return { data: await this.kpisService.getKpis(session.user.id, companyId, { from, to }) };
  }
}
