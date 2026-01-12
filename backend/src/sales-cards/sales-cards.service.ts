import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import type { SalesCardStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { PermissionKey } from '../auth/permissions';

function parseOptionalIsoDate(input?: string) {
  if (!input) return undefined;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

@Injectable()
export class SalesCardsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCompanyAccess(userId: string, companyId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, companyId, archivedAt: null },
      include: {
        company: true,
        membershipRoles: {
          include: { role: { select: { id: true, name: true, permissions: true, archivedAt: true } } },
        },
      },
    });

    if (!membership || membership.company.archivedAt) {
      throw new ForbiddenException('No access to this company');
    }

    return membership;
  }

  private async hasPermission(
    userId: string,
    companyId: string,
    membership: Awaited<ReturnType<SalesCardsService['assertCompanyAccess']>>,
    permission: PermissionKey,
  ) {
    if (membership.company.ownerId === userId) return true;

    const permissions = new Set<string>();
    for (const mr of membership.membershipRoles) {
      if (!mr.role.archivedAt) {
        for (const p of mr.role.permissions ?? []) permissions.add(p);
      }
    }

    return permissions.has(permission);
  }

  async listSalesCards(
    requesterId: string,
    companyId: string,
    query: { from?: string; to?: string; status?: SalesCardStatus; userId?: string },
  ) {
    await this.assertCompanyAccess(requesterId, companyId);

    const from = parseOptionalIsoDate(query.from);
    const to = parseOptionalIsoDate(query.to);
    if (query.from && !from) throw new BadRequestException('Invalid `from` date');
    if (query.to && !to) throw new BadRequestException('Invalid `to` date');
    if (from && to && from.getTime() > to.getTime()) {
      throw new BadRequestException('`from` cannot be after `to`');
    }

    return this.prisma.salesCard.findMany({
      where: {
        companyId,
        ...(from || to
          ? { startAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
          : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.userId ? { userId: query.userId } : {}),
      },
      orderBy: { startAt: 'desc' },
      include: {
        location: { select: { id: true, name: true } },
        _count: { select: { lines: true } },
      },
    });
  }

  async startSalesCard(
    userId: string,
    companyId: string,
    input: { note?: string; roleId?: string; locationId?: string; startAt?: string },
  ) {
    const membership = await this.assertCompanyAccess(userId, companyId);

    const existingActive = await this.prisma.salesCard.findFirst({
      where: { companyId, userId, status: 'DRAFT' },
      select: { id: true },
    });
    if (existingActive) {
      throw new BadRequestException('You already have an active shift card');
    }

    const activeRoles = membership.membershipRoles
      .filter((r) => !r.role.archivedAt)
      .map((r) => r.role)
      .sort((a, b) => a.name.localeCompare(b.name));
    const requestedRoleId = input.roleId?.trim();
    const roleId =
      requestedRoleId ||
      activeRoles.find((r) => (r.permissions ?? []).includes('salesCards.create'))?.id ||
      activeRoles[0]?.id;
    if (!roleId) {
      throw new BadRequestException('No role available for this member');
    }

    const allowedRoleIds = new Set(activeRoles.map((r) => r.id));
    if (!allowedRoleIds.has(roleId)) {
      throw new ForbiddenException('You do not have access to this role');
    }

    const locationId = input.locationId?.trim() || undefined;
    if (locationId) {
      const location = await this.prisma.companyLocation.findFirst({
        where: { id: locationId, companyId, archivedAt: null },
        select: { id: true },
      });
      if (!location) {
        throw new BadRequestException('Invalid locationId for this company');
      }
    }

    const startAt = parseOptionalIsoDate(input.startAt) ?? new Date();
    const note = input.note?.trim() || undefined;

    return this.prisma.salesCard.create({
      data: {
        companyId,
        userId,
        roleId,
        locationId,
        startAt,
        note,
        status: 'DRAFT',
      },
      include: {
        location: { select: { id: true, name: true } },
        lines: { include: { item: { select: { id: true, name: true, unit: true, category: true } } } },
      },
    });
  }

  async getSalesCard(requesterId: string, companyId: string, cardId: string) {
    await this.assertCompanyAccess(requesterId, companyId);

    const card = await this.prisma.salesCard.findFirst({
      where: { id: cardId, companyId },
      include: {
        location: { select: { id: true, name: true } },
        lines: {
          orderBy: { item: { name: 'asc' } },
          include: { item: { select: { id: true, name: true, unit: true, category: true } } },
        },
      },
    });
    if (!card) {
      throw new NotFoundException('Sales card not found');
    }
    return card;
  }

  async getActiveSalesCard(userId: string, companyId: string) {
    await this.assertCompanyAccess(userId, companyId);

    return this.prisma.salesCard.findFirst({
      where: { companyId, userId, status: 'DRAFT' },
      orderBy: { startAt: 'desc' },
      include: {
        location: { select: { id: true, name: true } },
        lines: {
          orderBy: { item: { name: 'asc' } },
          include: { item: { select: { id: true, name: true, unit: true, category: true } } },
        },
      },
    });
  }

  async updateSalesCard(
    userId: string,
    companyId: string,
    cardId: string,
    input: { note?: string; lines?: { itemId: string; quantitySold: number }[] },
  ) {
    const membership = await this.assertCompanyAccess(userId, companyId);

    const card = await this.prisma.salesCard.findFirst({
      where: { id: cardId, companyId },
      select: { id: true, userId: true, status: true },
    });
    if (!card) {
      throw new NotFoundException('Sales card not found');
    }
    const isOwnerOfCard = card.userId === userId;
    if (!isOwnerOfCard) {
      const canEditAny = await this.hasPermission(
        userId,
        companyId,
        membership,
        'salesCards.edit.anyUnlocked',
      );
      if (!canEditAny) throw new ForbiddenException('You can only edit your own sales card');
    }
    if (card.status === 'LOCKED') {
      throw new BadRequestException('LOCKED cards cannot be edited');
    }
    if (card.status !== 'DRAFT' && isOwnerOfCard) {
      throw new BadRequestException('Only DRAFT cards can be edited by the card owner');
    }

    const note = input.note === undefined ? undefined : input.note.trim() || undefined;

    if (input.lines === undefined) {
      return this.prisma.salesCard.update({
        where: { id: card.id },
        data: { note },
        include: {
          location: { select: { id: true, name: true } },
          lines: {
            orderBy: { item: { name: 'asc' } },
            include: { item: { select: { id: true, name: true, unit: true, category: true } } },
          },
        },
      });
    }

    const lines = input.lines ?? [];
    const normalized = lines.map((line) => ({
      itemId: String(line.itemId).trim(),
      quantitySold: line.quantitySold,
    }));

    const invalidItemId = normalized.find((line) => !line.itemId);
    if (invalidItemId) {
      throw new BadRequestException('Each line must include a valid itemId');
    }

    const duplicateIds = new Set<string>();
    for (const line of normalized) {
      if (duplicateIds.has(line.itemId)) {
        throw new BadRequestException('Duplicate itemId in lines');
      }
      duplicateIds.add(line.itemId);
    }

    const positiveLines = normalized.filter((line) => line.quantitySold > 0);
    const items = await this.prisma.item.findMany({
      where: { companyId, archivedAt: null, id: { in: positiveLines.map((l) => l.itemId) } },
      select: { id: true },
    });
    if (items.length !== positiveLines.length) {
      throw new BadRequestException('One or more items do not exist in this company');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.salesCard.update({
        where: { id: card.id },
        data: { note },
      });

      await tx.salesCardLine.deleteMany({ where: { salesCardId: card.id } });
      if (positiveLines.length) {
        await tx.salesCardLine.createMany({
          data: positiveLines.map((line) => ({
            salesCardId: card.id,
            itemId: line.itemId,
            quantitySold: line.quantitySold,
            unitPrice: null,
            total: null,
          })),
        });
      }

      return tx.salesCard.findUnique({
        where: { id: card.id },
        include: {
          location: { select: { id: true, name: true } },
          lines: {
            orderBy: { item: { name: 'asc' } },
            include: { item: { select: { id: true, name: true, unit: true, category: true } } },
          },
        },
      });
    });
  }

  async stopSalesCard(
    userId: string,
    companyId: string,
    cardId: string,
    input: { endAt?: string },
  ) {
    const membership = await this.assertCompanyAccess(userId, companyId);

    const card = await this.prisma.salesCard.findFirst({
      where: { id: cardId, companyId },
      include: { lines: { select: { id: true, itemId: true, quantitySold: true } } },
    });
    if (!card) {
      throw new NotFoundException('Sales card not found');
    }
    if (card.userId !== userId) {
      const canStopAny = await this.hasPermission(
        userId,
        companyId,
        membership,
        'salesCards.stop.anyDraft',
      );
      if (!canStopAny) throw new ForbiddenException('You can only stop your own sales card');
    }
    if (card.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT cards can be stopped');
    }

    const endAt = parseOptionalIsoDate(input.endAt) ?? new Date();
    if (endAt.getTime() < card.startAt.getTime()) {
      throw new BadRequestException('endAt cannot be before startAt');
    }

    const itemIds = card.lines.map((l) => l.itemId);
    const items = itemIds.length
      ? await this.prisma.item.findMany({
          where: { companyId, id: { in: itemIds } },
          select: { id: true, basePrice: true },
        })
      : [];
    const basePriceById = new Map(items.map((i) => [i.id, i.basePrice] as const));

    return this.prisma.$transaction(async (tx) => {
      for (const line of card.lines) {
        const basePrice = basePriceById.get(line.itemId) ?? null;
        const unitPrice = basePrice;
        const total = basePrice === null ? null : basePrice.mul(line.quantitySold);

        await tx.salesCardLine.update({
          where: { id: line.id },
          data: { unitPrice, total },
        });
      }

      await tx.salesCard.update({
        where: { id: card.id },
        data: { status: 'SUBMITTED', endAt },
      });

      return tx.salesCard.findUnique({
        where: { id: card.id },
        include: {
          location: { select: { id: true, name: true } },
          lines: {
            orderBy: { item: { name: 'asc' } },
            include: { item: { select: { id: true, name: true, unit: true, category: true } } },
          },
        },
      });
    });
  }

  async lockSalesCard(userId: string, companyId: string, cardId: string) {
    await this.assertCompanyAccess(userId, companyId);

    const card = await this.prisma.salesCard.findFirst({
      where: { id: cardId, companyId },
      select: { id: true, status: true },
    });
    if (!card) {
      throw new NotFoundException('Sales card not found');
    }
    if (card.status !== 'SUBMITTED') {
      throw new BadRequestException('Only SUBMITTED cards can be locked');
    }

    return this.prisma.salesCard.update({
      where: { id: card.id },
      data: { status: 'LOCKED' },
      include: {
        location: { select: { id: true, name: true } },
        lines: {
          orderBy: { item: { name: 'asc' } },
          include: { item: { select: { id: true, name: true, unit: true, category: true } } },
        },
      },
    });
  }
}
