import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SnapshotsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCompanyAccess(userId: string, companyId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, companyId, archivedAt: null },
      include: { company: true },
    });

    if (!membership || membership.company.archivedAt) {
      throw new ForbiddenException('No access to this company');
    }

    return membership.company;
  }

  async createSnapshot(
    userId: string,
    companyId: string,
    input: { note?: string; lines: { itemId: string; quantity: number }[] },
  ) {
    await this.assertCompanyAccess(userId, companyId);

    const lines = input.lines ?? [];
    if (!lines.length) {
      throw new BadRequestException('At least one snapshot line is required');
    }

    const normalized = lines.map((line) => ({
      itemId: String(line.itemId).trim(),
      quantity: line.quantity,
    }));

    const invalidItemId = normalized.find((line) => !line.itemId);
    if (invalidItemId) {
      throw new BadRequestException('Each snapshot line must include a valid itemId');
    }

    const duplicateIds = new Set<string>();
    for (const line of normalized) {
      if (duplicateIds.has(line.itemId)) {
        throw new BadRequestException('Duplicate itemId in snapshot lines');
      }
      duplicateIds.add(line.itemId);
    }

    const items = await this.prisma.item.findMany({
      where: { companyId, archivedAt: null, id: { in: normalized.map((l) => l.itemId) } },
      select: { id: true },
    });
    if (items.length !== normalized.length) {
      throw new BadRequestException('One or more items do not exist in this company');
    }

    const note = input.note?.trim() || undefined;
    return this.prisma.$transaction(async (tx) => {
      const snapshot = await tx.inventorySnapshot.create({
        data: {
          companyId,
          createdById: userId,
          note,
        },
      });

      await tx.inventorySnapshotLine.createMany({
        data: normalized.map((line) => ({
          snapshotId: snapshot.id,
          itemId: line.itemId,
          quantity: line.quantity,
        })),
      });

      return tx.inventorySnapshot.findUnique({
        where: { id: snapshot.id },
        include: {
          lines: {
            include: { item: { select: { id: true, name: true, unit: true, category: true } } },
            orderBy: { item: { name: 'asc' } },
          },
        },
      });
    });
  }

  async listSnapshots(userId: string, companyId: string) {
    await this.assertCompanyAccess(userId, companyId);

    return this.prisma.inventorySnapshot.findMany({
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

  async getSnapshot(userId: string, companyId: string, snapshotId: string) {
    await this.assertCompanyAccess(userId, companyId);

    const snapshot = await this.prisma.inventorySnapshot.findFirst({
      where: { id: snapshotId, companyId },
      include: {
        lines: {
          include: { item: { select: { id: true, name: true, unit: true, category: true } } },
          orderBy: { item: { name: 'asc' } },
        },
      },
    });

    if (!snapshot) {
      throw new NotFoundException('Snapshot not found');
    }

    return snapshot;
  }
}

