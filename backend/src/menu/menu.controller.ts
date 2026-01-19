import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CreateMenuEntryDto } from './dto/create-menu-entry.dto';
import { MenuService } from './menu.service';

@Controller('companies/:companyId/menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @RequirePermissions('inventory.read')
  async listMenuEntries(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
  ) {
    return { data: await this.menuService.listMenuEntries(session.user.id, companyId) };
  }

  @Post()
  @RequirePermissions('inventory.write')
  async createMenuEntry(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Body() body: CreateMenuEntryDto,
  ) {
    return { data: await this.menuService.createMenuEntry(session.user.id, companyId, body) };
  }

  @Delete(':entryId')
  @RequirePermissions('inventory.write')
  async deleteMenuEntry(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Param('entryId') entryId: string,
  ) {
    return { data: await this.menuService.deleteMenuEntry(session.user.id, companyId, entryId) };
  }
}
