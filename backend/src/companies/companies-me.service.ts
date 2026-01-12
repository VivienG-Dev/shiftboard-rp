import { ForbiddenException, Injectable } from '@nestjs/common';
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
      },
      company: membership.company,
      roles: membership.membershipRoles.map((mr) => mr.role),
    };
  }
}
