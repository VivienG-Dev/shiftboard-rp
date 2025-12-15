import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanyMembersService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCompanyAccess(userId: string, companyId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, companyId, archivedAt: null },
      include: { company: { select: { archivedAt: true } } },
    });
    if (!membership || membership.company.archivedAt) {
      throw new ForbiddenException('No access to this company');
    }
  }

  async listMembers(ownerId: string, companyId: string) {
    await this.assertCompanyAccess(ownerId, companyId);

    const memberships = await this.prisma.membership.findMany({
      where: { companyId, archivedAt: null },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        membershipRoles: {
          include: { role: { select: { id: true, name: true, key: true, isSystem: true, archivedAt: true } } },
        },
      },
    });

    return memberships.map((m) => ({
      membership: {
        id: m.id,
        companyId: m.companyId,
        userId: m.userId,
        activeRoleId: m.activeRoleId,
        createdAt: m.createdAt,
      },
      user: m.user,
      roles: m.membershipRoles.filter((mr) => !mr.role.archivedAt).map((mr) => mr.role),
    }));
  }

  async updateMember(ownerId: string, companyId: string, membershipId: string, input: { activeRoleId?: string }) {
    await this.assertCompanyAccess(ownerId, companyId);

    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, companyId, archivedAt: null },
      include: { membershipRoles: { select: { roleId: true } } },
    });
    if (!membership) throw new NotFoundException('Member not found');

    if (input.activeRoleId !== undefined) {
      const roleId = input.activeRoleId.trim();
      if (!roleId) throw new BadRequestException('activeRoleId cannot be empty');

      const allowedRoleIds = new Set(membership.membershipRoles.map((r) => r.roleId));
      if (!allowedRoleIds.has(roleId)) throw new BadRequestException('Member does not have this role');

      return this.prisma.membership.update({
        where: { id: membership.id },
        data: { activeRoleId: roleId },
      });
    }

    return this.prisma.membership.findUnique({ where: { id: membership.id } });
  }

  async addMemberRole(ownerId: string, companyId: string, membershipId: string, roleId: string) {
    await this.assertCompanyAccess(ownerId, companyId);

    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, companyId, archivedAt: null },
      select: { id: true },
    });
    if (!membership) throw new NotFoundException('Member not found');

    const role = await this.prisma.companyRole.findFirst({
      where: { id: roleId, companyId, archivedAt: null },
      select: { id: true, isSystem: true },
    });
    if (!role) throw new BadRequestException('Invalid roleId for this company');
    if (role.isSystem) throw new BadRequestException('System roles cannot be assigned');

    try {
      await this.prisma.membershipRole.create({
        data: { membershipId: membership.id, roleId: role.id },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Member already has this role');
      }
      throw e;
    }

    const updated = await this.prisma.membership.findUnique({
      where: { id: membership.id },
      include: {
        membershipRoles: {
          include: { role: { select: { id: true, name: true, key: true, isSystem: true, archivedAt: true } } },
        },
      },
    });

    return {
      membershipId: updated!.id,
      activeRoleId: updated!.activeRoleId,
      roles: updated!.membershipRoles.filter((mr) => !mr.role.archivedAt).map((mr) => mr.role),
    };
  }

  async removeMemberRole(ownerId: string, companyId: string, membershipId: string, roleId: string) {
    await this.assertCompanyAccess(ownerId, companyId);

    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, companyId, archivedAt: null },
      include: { membershipRoles: { select: { roleId: true } } },
    });
    if (!membership) throw new NotFoundException('Member not found');

    await this.prisma.membershipRole.deleteMany({
      where: { membershipId: membership.id, roleId },
    });

    const remainingRoleIds = membership.membershipRoles
      .map((r) => r.roleId)
      .filter((id) => id !== roleId);

    const nextActiveRoleId =
      membership.activeRoleId === roleId ? remainingRoleIds[0] ?? null : undefined;

    if (nextActiveRoleId !== undefined) {
      await this.prisma.membership.update({
        where: { id: membership.id },
        data: { activeRoleId: nextActiveRoleId },
      });
    }

    const updated = await this.prisma.membership.findUnique({
      where: { id: membership.id },
      include: {
        membershipRoles: {
          include: { role: { select: { id: true, name: true, key: true, isSystem: true, archivedAt: true } } },
        },
      },
    });

    return {
      membershipId: updated!.id,
      activeRoleId: updated!.activeRoleId,
      roles: updated!.membershipRoles.filter((mr) => !mr.role.archivedAt).map((mr) => mr.role),
    };
  }

  async archiveMember(ownerId: string, companyId: string, membershipId: string) {
    await this.assertCompanyAccess(ownerId, companyId);

    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, companyId, archivedAt: null },
      select: { id: true, userId: true },
    });
    if (!membership) throw new NotFoundException('Member not found');

    const company = await this.prisma.company.findFirst({
      where: { id: companyId },
      select: { ownerId: true },
    });
    if (company?.ownerId === membership.userId) {
      throw new BadRequestException('Cannot archive the owner membership');
    }

    return this.prisma.membership.update({
      where: { id: membership.id },
      data: { archivedAt: new Date(), activeRoleId: null },
    });
  }
}
