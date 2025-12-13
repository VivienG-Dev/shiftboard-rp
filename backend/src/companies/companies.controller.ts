import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';

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

  @Get(':companyId')
  async getCompany(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
  ) {
    return { data: await this.companiesService.getCompany(session.user.id, companyId) };
  }
}
