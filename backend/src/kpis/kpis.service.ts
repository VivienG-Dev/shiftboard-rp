import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import type { SalesCardStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

function parseOptionalIsoDate(input?: string) {
  if (!input) return undefined;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

@Injectable()
export class KpisService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCompanyAccess(userId: string, companyId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, companyId, archivedAt: null },
      include: { company: true },
    });

    if (!membership || membership.company.archivedAt) {
      throw new ForbiddenException('No access to this company');
    }
  }

  async getKpis(userId: string, companyId: string, query: { from?: string; to?: string }) {
    await this.assertCompanyAccess(userId, companyId);

    const from = parseOptionalIsoDate(query.from);
    const to = parseOptionalIsoDate(query.to);
    if (query.from && !from) throw new BadRequestException('Invalid `from` date');
    if (query.to && !to) throw new BadRequestException('Invalid `to` date');
    if (from && to && from.getTime() > to.getTime()) {
      throw new BadRequestException('`from` cannot be after `to`');
    }

    const statusIn: SalesCardStatus[] = ['SUBMITTED', 'LOCKED'];
    const salesCardWhere: Prisma.SalesCardWhereInput = {
      companyId,
      status: { in: statusIn },
      ...(from || to
        ? { startAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
    };

    const [revenueAgg, soldAgg, activeStaff] = await Promise.all([
      this.prisma.salesCardLine.aggregate({
        where: { salesCard: salesCardWhere, total: { not: null } },
        _sum: { total: true },
      }),
      this.prisma.salesCardLine.aggregate({
        where: { salesCard: salesCardWhere },
        _sum: { quantitySold: true },
      }),
      this.prisma.salesCard.groupBy({
        by: ['userId'],
        where: salesCardWhere,
        _count: { _all: true },
      }),
    ]);

    const revenueDecimal = revenueAgg._sum?.total ?? null;
    const revenue = revenueDecimal ? revenueDecimal.toNumber() : 0;
    const itemsSold = soldAgg._sum?.quantitySold ?? 0;

    return {
      from: from?.toISOString() ?? null,
      to: to?.toISOString() ?? null,
      revenue,
      itemsSold,
      activeStaff: activeStaff.length,
    };
  }
}
