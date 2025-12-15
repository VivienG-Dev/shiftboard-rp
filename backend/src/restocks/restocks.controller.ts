import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CreateRestockDto } from './dto/create-restock.dto';
import { RestocksService } from './restocks.service';

@Controller('companies/:companyId/restocks')
export class RestocksController {
  constructor(private readonly restocksService: RestocksService) {}

  @Post()
  @RequirePermissions('inventory.write')
  async createRestock(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Body() body: CreateRestockDto,
  ) {
    return { data: await this.restocksService.createRestock(session.user.id, companyId, body) };
  }

  @Get()
  @RequirePermissions('inventory.read')
  async listRestocks(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
  ) {
    return { data: await this.restocksService.listRestocks(session.user.id, companyId) };
  }

  @Get(':restockId')
  @RequirePermissions('inventory.read')
  async getRestock(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Param('restockId') restockId: string,
  ) {
    return { data: await this.restocksService.getRestock(session.user.id, companyId, restockId) };
  }
}

