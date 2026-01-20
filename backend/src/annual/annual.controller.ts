import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AnnualService } from './annual.service';
import { CreateAnnualEntryDto } from './dto/create-annual-entry.dto';
import { ListAnnualQueryDto } from './dto/list-annual-query.dto';

@Controller('companies/:companyId/annual')
export class AnnualController {
  constructor(private readonly annualService: AnnualService) {}

  @Get()
  @RequirePermissions('stats.read')
  async listAnnual(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Query() query: ListAnnualQueryDto,
  ) {
    return { data: await this.annualService.listAnnualEntries(session.user.id, companyId, query) };
  }

  @Post()
  @RequirePermissions('company.update')
  async createAnnual(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Body() body: CreateAnnualEntryDto,
  ) {
    return { data: await this.annualService.createAnnualEntry(session.user.id, companyId, body) };
  }

  @Delete(':entryId')
  @RequirePermissions('company.update')
  async deleteAnnual(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Param('entryId') entryId: string,
  ) {
    return { data: await this.annualService.deleteAnnualEntry(session.user.id, companyId, entryId) };
  }
}
