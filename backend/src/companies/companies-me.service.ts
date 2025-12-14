import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompaniesMeService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyMembership(userId: string, companyId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, companyId, archivedAt: null },
      include: {
        membershipRoles: {
          include: { role: { select: { id: true, name: true, key: true, permissions: true } } },
        },
        company: { select: { id: true, name: true, ownerId: true, archivedAt: true } },
      },
    });
    if (!membership || membership.company.archivedAt) throw new ForbiddenException('No access to this company');

    return {
      membership: {
        id: membership.id,
        companyId: membership.companyId,
        userId: membership.userId,
        activeRoleId: membership.activeRoleId,
      },
      company: membership.company,
      roles: membership.membershipRoles.map((mr) => mr.role),
    };
  }

  async updateMyMembership(userId: string, companyId: string, input: { activeRoleId?: string }) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, companyId, archivedAt: null },
      include: { company: { select: { archivedAt: true } }, membershipRoles: { select: { roleId: true } } },
    });
    if (!membership || membership.company.archivedAt) throw new ForbiddenException('No access to this company');

    if (input.activeRoleId !== undefined) {
      const roleId = input.activeRoleId.trim();
      if (!roleId) throw new BadRequestException('activeRoleId cannot be empty');
      const allowedRoleIds = new Set(membership.membershipRoles.map((r) => r.roleId));
      if (!allowedRoleIds.has(roleId)) {
        throw new NotFoundException('You do not have this role');
      }
      return this.prisma.membership.update({
        where: { id: membership.id },
        data: { activeRoleId: roleId },
      });
    }

    return this.prisma.membership.findUnique({ where: { id: membership.id } });
  }
}

