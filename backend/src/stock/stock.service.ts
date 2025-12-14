import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StockService {
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

  async getStock(userId: string, companyId: string) {
    await this.assertCompanyAccess(userId, companyId);

    const latestSnapshot = await this.prisma.inventorySnapshot.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true },
    });

    const items = await this.prisma.item.findMany({
      where: { companyId, archivedAt: null },
      select: { id: true, name: true, unit: true, category: true, lowStockThreshold: true },
      orderBy: { name: 'asc' },
    });

    if (!latestSnapshot) {
      return items.map((item) => ({
        itemId: item.id,
        name: item.name,
        unit: item.unit,
        category: item.category,
        lowStockThreshold: item.lowStockThreshold,
        baselineSnapshotId: null,
        baselineQuantity: 0,
        soldSinceBaseline: 0,
        currentStock: 0,
        isLowStock:
          item.lowStockThreshold === null || item.lowStockThreshold === undefined
            ? false
            : 0 < item.lowStockThreshold,
      }));
    }

    const snapshotLines = await this.prisma.inventorySnapshotLine.findMany({
      where: { snapshotId: latestSnapshot.id },
      select: { itemId: true, quantity: true },
    });
    const baselineByItemId = new Map(snapshotLines.map((l) => [l.itemId, l.quantity] as const));

    const soldLines = await this.prisma.salesCardLine.findMany({
      where: {
        salesCard: {
          companyId,
          status: { in: ['SUBMITTED', 'LOCKED'] },
          startAt: { gte: latestSnapshot.createdAt },
        },
      },
      select: { itemId: true, quantitySold: true },
    });
    const soldByItemId = new Map<string, number>();
    for (const line of soldLines) {
      soldByItemId.set(line.itemId, (soldByItemId.get(line.itemId) ?? 0) + line.quantitySold);
    }

    return items.map((item) => {
      const baselineQuantity = baselineByItemId.get(item.id) ?? 0;
      const soldSinceBaseline = soldByItemId.get(item.id) ?? 0;
      const currentStock = baselineQuantity - soldSinceBaseline;
      return {
        itemId: item.id,
        name: item.name,
        unit: item.unit,
        category: item.category,
        lowStockThreshold: item.lowStockThreshold,
        baselineSnapshotId: latestSnapshot.id,
        baselineQuantity,
        soldSinceBaseline,
        currentStock,
        isLowStock:
          item.lowStockThreshold === null || item.lowStockThreshold === undefined
            ? false
            : currentStock < item.lowStockThreshold,
      };
    });
  }
}
