import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import type { ItemCategory } from '../../generated/prisma/client';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemsService } from './items.service';
import { RequirePermissions } from '../auth/permissions.decorator';

@Controller('companies/:companyId/items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @RequirePermissions('inventory.read')
  async listItems(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Query('category') category?: ItemCategory,
    @Query('activeOnly') activeOnly?: string,
    @Query('includeArchived') includeArchived?: string,
    @Query('search') search?: string,
  ) {
    return {
      data: await this.itemsService.listItems(session.user.id, companyId, {
        category,
        activeOnly: activeOnly !== 'false',
        includeArchived: includeArchived === 'true',
        search,
      }),
    };
  }

  @Post()
  @RequirePermissions('inventory.write')
  async createItem(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Body() body: CreateItemDto,
  ) {
    return { data: await this.itemsService.createItem(session.user.id, companyId, body) };
  }

  @Patch(':itemId')
  @RequirePermissions('inventory.write')
  async updateItem(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Param('itemId') itemId: string,
    @Body() body: UpdateItemDto,
  ) {
    return { data: await this.itemsService.updateItem(session.user.id, companyId, itemId, body) };
  }

  @Post(':itemId/archive')
  @RequirePermissions('inventory.write')
  async archiveItem(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Param('itemId') itemId: string,
  ) {
    return { data: await this.itemsService.archiveItem(session.user.id, companyId, itemId) };
  }
}
