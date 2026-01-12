import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { AddMemberRoleDto } from './dto/add-member-role.dto';
import { CompanyMembersService } from './company-members.service';
import { RequirePermissions } from '../auth/permissions.decorator';

@Controller('companies/:companyId/members')
export class CompanyMembersController {
  constructor(private readonly membersService: CompanyMembersService) {}

  @Get()
  @RequirePermissions('members.read')
  async listMembers(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
  ) {
    return { data: await this.membersService.listMembers(session.user.id, companyId) };
  }

  @Post(':memberId/roles')
  @RequirePermissions('members.updateRole')
  async addMemberRole(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Param('memberId') memberId: string,
    @Body() body: AddMemberRoleDto,
  ) {
    return {
      data: await this.membersService.addMemberRole(session.user.id, companyId, memberId, body.roleId),
    };
  }

  @Delete(':memberId/roles/:roleId')
  @RequirePermissions('members.updateRole')
  async removeMemberRole(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Param('memberId') memberId: string,
    @Param('roleId') roleId: string,
  ) {
    return { data: await this.membersService.removeMemberRole(session.user.id, companyId, memberId, roleId) };
  }

  @Post(':memberId/archive')
  @RequirePermissions('members.updateRole')
  async archiveMember(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Param('memberId') memberId: string,
  ) {
    return { data: await this.membersService.archiveMember(session.user.id, companyId, memberId) };
  }
}
