import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import type { ItemCategory } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

function extractUniqueConstraintFields(error: Prisma.PrismaClientKnownRequestError) {
  const meta = (error.meta ?? {}) as Record<string, unknown>;

  const targets = meta['target'];
  if (Array.isArray(targets) && targets.every((t) => typeof t === 'string')) {
    return targets as string[];
  }
  if (typeof targets === 'string') {
    return [targets];
  }

  const driverFields = (meta as any)?.driverAdapterError?.cause?.constraint?.fields;
  if (Array.isArray(driverFields) && driverFields.every((t: unknown) => typeof t === 'string')) {
    return driverFields as string[];
  }

  const constraintFields = (meta as any)?.constraint?.fields;
  if (
    Array.isArray(constraintFields) &&
    constraintFields.every((t: unknown) => typeof t === 'string')
  ) {
    return constraintFields as string[];
  }

  return [];
}

@Injectable()
export class ItemsService {
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

  async listItems(
    userId: string,
    companyId: string,
    query: { category?: ItemCategory; activeOnly?: boolean; includeArchived?: boolean; search?: string },
  ) {
    await this.assertCompanyAccess(userId, companyId);

    const search = query.search?.trim();
    return this.prisma.item.findMany({
      where: {
        companyId,
        ...(query.includeArchived ? {} : { archivedAt: null }),
        ...(query.activeOnly === false ? {} : { isActive: true }),
        ...(query.category ? { category: query.category } : {}),
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createItem(
    userId: string,
    companyId: string,
    input: {
      name: string;
      category: ItemCategory;
      unit: string;
      basePrice?: number;
      costPrice?: number;
      lowStockThreshold?: number;
    },
  ) {
    await this.assertCompanyAccess(userId, companyId);

    const name = input.name?.trim();
    if (!name) {
      throw new BadRequestException('Item name is required');
    }
    const unit = input.unit?.trim();
    if (!unit) {
      throw new BadRequestException('Item unit is required');
    }

    try {
      return await this.prisma.item.create({
        data: {
          companyId,
          name,
          category: input.category,
          unit,
          basePrice: input.basePrice === undefined ? undefined : new Prisma.Decimal(String(input.basePrice)),
          costPrice: input.costPrice === undefined ? undefined : new Prisma.Decimal(String(input.costPrice)),
          lowStockThreshold: input.lowStockThreshold,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const fields = extractUniqueConstraintFields(error);
        const field = fields.includes('name') ? 'name' : fields[0];
        throw new HttpException(
          {
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
            message: 'An item with this name already exists in this company',
            field,
            fields,
            code: error.code,
          },
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  async updateItem(
    userId: string,
    companyId: string,
    itemId: string,
    input: {
      name?: string;
      category?: ItemCategory;
      unit?: string;
      basePrice?: number | null;
      costPrice?: number | null;
      lowStockThreshold?: number | null;
      isActive?: boolean;
    },
  ) {
    await this.assertCompanyAccess(userId, companyId);

    const existing = await this.prisma.item.findFirst({
      where: { id: itemId, companyId, archivedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Item not found');
    }

    const name = input.name === undefined ? undefined : input.name.trim();
    if (name !== undefined && !name) {
      throw new BadRequestException('Item name is required');
    }
    const unit = input.unit === undefined ? undefined : input.unit.trim();
    if (unit !== undefined && !unit) {
      throw new BadRequestException('Item unit is required');
    }

    try {
      return await this.prisma.item.update({
        where: { id: existing.id },
        data: {
          name,
          category: input.category,
          unit,
          isActive: input.isActive,
          basePrice:
            input.basePrice === undefined
              ? undefined
              : input.basePrice === null
                ? null
                : new Prisma.Decimal(String(input.basePrice)),
          costPrice:
            input.costPrice === undefined
              ? undefined
              : input.costPrice === null
                ? null
                : new Prisma.Decimal(String(input.costPrice)),
          lowStockThreshold: input.lowStockThreshold,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const fields = extractUniqueConstraintFields(error);
        const field = fields.includes('name') ? 'name' : fields[0];
        throw new HttpException(
          {
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
            message: 'An item with this name already exists in this company',
            field,
            fields,
            code: error.code,
          },
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  async archiveItem(userId: string, companyId: string, itemId: string) {
    await this.assertCompanyAccess(userId, companyId);

    const existing = await this.prisma.item.findFirst({
      where: { id: itemId, companyId, archivedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Item not found');
    }

    return this.prisma.item.update({
      where: { id: existing.id },
      data: { archivedAt: new Date(), isActive: false },
    });
  }
}
