import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CompanyBankMovementType, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RestocksService {
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

  async createRestock(
    userId: string,
    companyId: string,
    input: { note?: string; lines: { itemId: string; quantityAdded: number }[] },
  ) {
    await this.assertCompanyAccess(userId, companyId);

    const lines = input.lines ?? [];
    if (!lines.length) {
      throw new BadRequestException('At least one restock line is required');
    }

    const normalized = lines.map((line) => ({
      itemId: String(line.itemId).trim(),
      quantityAdded: line.quantityAdded,
    }));

    const invalidItemId = normalized.find((line) => !line.itemId);
    if (invalidItemId) {
      throw new BadRequestException('Each restock line must include a valid itemId');
    }

    const duplicateIds = new Set<string>();
    for (const line of normalized) {
      if (duplicateIds.has(line.itemId)) {
        throw new BadRequestException('Duplicate itemId in restock lines');
      }
      duplicateIds.add(line.itemId);
    }

    const items = await this.prisma.item.findMany({
      where: { companyId, archivedAt: null, id: { in: normalized.map((l) => l.itemId) } },
      select: { id: true, costPrice: true },
    });
    if (items.length !== normalized.length) {
      throw new BadRequestException('One or more items do not exist in this company');
    }

    const itemById = new Map(items.map((item) => [item.id, item]));
    let totalCost = new Prisma.Decimal(0);
    for (const line of normalized) {
      const item = itemById.get(line.itemId);
      if (!item) continue;
      const costPrice = item.costPrice ?? new Prisma.Decimal(0);
      totalCost = totalCost.add(costPrice.mul(new Prisma.Decimal(line.quantityAdded)));
    }

    const note = input.note?.trim() || undefined;
    return this.prisma.$transaction(async (tx) => {
      const restock = await tx.restock.create({
        data: {
          companyId,
          createdById: userId,
          note,
        },
      });

      await tx.restockLine.createMany({
        data: normalized.map((line) => ({
          restockId: restock.id,
          itemId: line.itemId,
          quantityAdded: line.quantityAdded,
        })),
      });

      if (!totalCost.isZero()) {
        await tx.company.update({
          where: { id: companyId },
          data: { bankBalance: { decrement: totalCost } },
        });

        await tx.companyBankMovement.create({
          data: {
            companyId,
            type: CompanyBankMovementType.RESTOCK,
            amount: new Prisma.Decimal(0).sub(totalCost),
            restockId: restock.id,
            createdAt: restock.createdAt,
          },
        });
      }

      return tx.restock.findUnique({
        where: { id: restock.id },
        include: {
          lines: {
            include: { item: { select: { id: true, name: true, unit: true, category: true } } },
            orderBy: { item: { name: 'asc' } },
          },
        },
      });
    });
  }

  async listRestocks(userId: string, companyId: string) {
    await this.assertCompanyAccess(userId, companyId);

    return this.prisma.restock.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        companyId: true,
        createdById: true,
        createdAt: true,
        note: true,
        _count: { select: { lines: true } },
      },
    });
  }

  async getRestock(userId: string, companyId: string, restockId: string) {
    await this.assertCompanyAccess(userId, companyId);

    const restock = await this.prisma.restock.findFirst({
      where: { id: restockId, companyId },
      include: {
        lines: {
          include: { item: { select: { id: true, name: true, unit: true, category: true } } },
          orderBy: { item: { name: 'asc' } },
        },
      },
    });
    if (!restock) throw new NotFoundException('Restock not found');
    return restock;
  }
}
