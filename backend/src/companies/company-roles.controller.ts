import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CreateCompanyRoleDto } from './dto/create-company-role.dto';
import { UpdateCompanyRoleDto } from './dto/update-company-role.dto';
import { CompanyRolesService } from './company-roles.service';

@Controller('companies/:companyId/roles')
export class CompanyRolesController {
  constructor(private readonly rolesService: CompanyRolesService) {}

  @Get()
  @RequirePermissions('roles.manage')
  async listRoles(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
  ) {
    return { data: await this.rolesService.listRoles(session.user.id, companyId) };
  }

  @Post()
  @RequirePermissions('roles.manage')
  async createRole(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Body() body: CreateCompanyRoleDto,
  ) {
    return { data: await this.rolesService.createRole(session.user.id, companyId, body) };
  }

  @Patch(':roleId')
  @RequirePermissions('roles.manage')
  async updateRole(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Param('roleId') roleId: string,
    @Body() body: UpdateCompanyRoleDto,
  ) {
    return { data: await this.rolesService.updateRole(session.user.id, companyId, roleId, body) };
  }

  @Post(':roleId/archive')
  @RequirePermissions('roles.manage')
  async archiveRole(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Param('roleId') roleId: string,
  ) {
    return { data: await this.rolesService.archiveRole(session.user.id, companyId, roleId) };
  }
}

