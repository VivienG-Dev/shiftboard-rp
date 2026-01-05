import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreateCompanyLocationDto } from './dto/create-company-location.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  async createCompany(
    @Session() session: UserSession,
    @Body() body: CreateCompanyDto,
  ) {
    return this.companiesService.createCompany(session.user.id, body);
  }

  @Get()
  async listMyCompanies(@Session() session: UserSession) {
    return { data: await this.companiesService.listMyCompanies(session.user.id) };
  }

  @Post(':companyId/locations')
  async createCompanyLocation(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Body() body: CreateCompanyLocationDto,
  ) {
    return {
      data: await this.companiesService.createCompanyLocation(session.user.id, companyId, body),
    };
  }

  @Get(':companyId/locations')
  async listCompanyLocations(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
  ) {
    return { data: await this.companiesService.listCompanyLocations(session.user.id, companyId) };
  }

  @Get(':companyId')
  async getCompany(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
  ) {
    return { data: await this.companiesService.getCompany(session.user.id, companyId) };
  }

  @Patch(':companyId')
  @RequirePermissions('company.update')
  async updateCompany(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Body() body: UpdateCompanyDto,
  ) {
    return { data: await this.companiesService.updateCompany(session.user.id, companyId, body) };
  }

  @Post(':companyId/archive')
  @RequirePermissions('company.archive')
  async archiveCompany(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
  ) {
    return { data: await this.companiesService.archiveCompany(session.user.id, companyId) };
  }
}
