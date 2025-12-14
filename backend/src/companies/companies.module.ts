import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CompanyRolesController } from './company-roles.controller';
import { CompanyRolesService } from './company-roles.service';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';
import { CompaniesMeController } from './companies-me.controller';
import { CompaniesMeService } from './companies-me.service';
import { CompanyMembersController } from './company-members.controller';
import { CompanyMembersService } from './company-members.service';

@Module({
  controllers: [
    CompaniesController,
    CompaniesMeController,
    CompanyRolesController,
    InvitesController,
    CompanyMembersController,
  ],
  providers: [
    CompaniesService,
    CompaniesMeService,
    CompanyRolesService,
    InvitesService,
    CompanyMembersService,
  ],
})
export class CompaniesModule {}
