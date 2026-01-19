import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type MenuEntryResult = {
  id: string;
  companyId: string;
  type: 'ITEM' | 'CUSTOM';
  itemId: string | null;
  name: string;
  price: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class MenuService {
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

  async listMenuEntries(userId: string, companyId: string): Promise<MenuEntryResult[]> {
    await this.assertCompanyAccess(userId, companyId);

    const entries = await this.prisma.menuEntry.findMany({
      where: { companyId },
      include: { item: true },
      orderBy: { createdAt: 'asc' },
    });

    return entries.map((entry) => {
      const type = entry.itemId ? 'ITEM' : 'CUSTOM';
      const name =
        entry.item?.name?.trim() ||
        entry.name?.trim() ||
        (type === 'ITEM' ? 'Item indisponible' : 'Prestation');
      const price = entry.item?.basePrice ?? entry.price;
      return {
        id: entry.id,
        companyId: entry.companyId,
        type,
        itemId: entry.itemId,
        name,
        price: price === null || price === undefined ? null : Number(price),
        isActive: entry.isActive,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      };
    });
  }

  async createMenuEntry(
    userId: string,
    companyId: string,
    input: { itemId?: string; name?: string; price?: number },
  ) {
    await this.assertCompanyAccess(userId, companyId);

    if (input.itemId) {
      const item = await this.prisma.item.findFirst({
        where: { id: input.itemId, companyId, archivedAt: null },
      });
      if (!item) {
        throw new NotFoundException('Item not found');
      }

      const existing = await this.prisma.menuEntry.findFirst({
        where: { companyId, itemId: item.id },
      });
      if (existing) {
        throw new BadRequestException('Item already exists in menu');
      }

      return this.prisma.menuEntry.create({
        data: {
          companyId,
          itemId: item.id,
        },
      });
    }

    const name = input.name?.trim();
    if (!name) {
      throw new BadRequestException('Name is required for custom menu entry');
    }
    if (input.price === undefined || input.price === null) {
      throw new BadRequestException('Price is required for custom menu entry');
    }

    return this.prisma.menuEntry.create({
      data: {
        companyId,
        name,
        price: new Prisma.Decimal(String(input.price)),
      },
    });
  }

  async deleteMenuEntry(userId: string, companyId: string, entryId: string) {
    await this.assertCompanyAccess(userId, companyId);

    const entry = await this.prisma.menuEntry.findFirst({
      where: { id: entryId, companyId },
    });
    if (!entry) {
      throw new NotFoundException('Menu entry not found');
    }

    return this.prisma.menuEntry.delete({ where: { id: entry.id } });
  }
}
