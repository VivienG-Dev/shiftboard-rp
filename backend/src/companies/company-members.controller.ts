import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { AddMemberRoleDto } from './dto/add-member-role.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { CompanyMembersService } from './company-members.service';

@Controller('companies/:companyId/members')
export class CompanyMembersController {
  constructor(private readonly membersService: CompanyMembersService) {}

  @Get()
  async listMembers(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
  ) {
    return { data: await this.membersService.listMembers(session.user.id, companyId) };
  }

  @Patch(':memberId')
  async updateMember(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Param('memberId') memberId: string,
    @Body() body: UpdateMemberDto,
  ) {
    return { data: await this.membersService.updateMember(session.user.id, companyId, memberId, body) };
  }

  @Post(':memberId/roles')
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
  async removeMemberRole(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Param('memberId') memberId: string,
    @Param('roleId') roleId: string,
  ) {
    return { data: await this.membersService.removeMemberRole(session.user.id, companyId, memberId, roleId) };
  }

  @Post(':memberId/archive')
  async archiveMember(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Param('memberId') memberId: string,
  ) {
    return { data: await this.membersService.archiveMember(session.user.id, companyId, memberId) };
  }
}

