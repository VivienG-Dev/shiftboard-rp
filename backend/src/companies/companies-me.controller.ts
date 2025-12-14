import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { UpdateMyMembershipDto } from './dto/update-my-membership.dto';
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

  @Patch('me')
  async updateMyMembership(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Body() body: UpdateMyMembershipDto,
  ) {
    return { data: await this.meService.updateMyMembership(session.user.id, companyId, body) };
  }
}

