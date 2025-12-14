import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CreateInviteDto } from './dto/create-invite.dto';
import { InvitesService } from './invites.service';

@Controller()
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post('companies/:companyId/invites')
  @RequirePermissions('members.invite')
  async createInvite(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Body() body: CreateInviteDto,
  ) {
    return { data: await this.invitesService.createInvite(session.user.id, companyId, body) };
  }

  @Get('companies/:companyId/invites')
  @RequirePermissions('members.invite')
  async listInvites(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
  ) {
    return { data: await this.invitesService.listInvites(session.user.id, companyId) };
  }

  @Post('invites/:code/accept')
  async acceptInvite(
    @Session() session: UserSession,
    @Param('code') code: string,
  ) {
    return { data: await this.invitesService.acceptInvite(session.user.id, session.user.email, code) };
  }
}

