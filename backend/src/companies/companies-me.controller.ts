import { Controller, Get, Param } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { CompaniesMeService } from './companies-me.service';

@Controller('companies/:companyId')
export class CompaniesMeController {
  constructor(private readonly meService: CompaniesMeService) {}

  @Get('me')
  async getMyMembership(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
  ) {
    return { data: await this.meService.getMyMembership(session.user.id, companyId) };
  }

}
