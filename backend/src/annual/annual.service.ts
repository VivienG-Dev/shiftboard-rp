import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateAnnualEntryDto } from './dto/create-annual-entry.dto';
import type { ListAnnualQueryDto } from './dto/list-annual-query.dto';

type AnnualRow = {
  id: string | null;
  date: string; // YYYY-MM-DD
  revenue: number | null;
  expenses: number | null;
  startingCapital: number | null;
  total: number | null;
  itemsSold: number | null;
  profit: number | null;
  source: 'AUTO' | 'MANUAL';
};

function parseTzOffsetMinutes(input?: number) {
  if (input === undefined || input === null) return 0;
  if (!Number.isInteger(input)) return null;
  if (input < -14 * 60 || input > 14 * 60) return null;
  return input;
}

function toTzDate(date: Date, tzOffsetMinutes: number) {
  return new Date(date.getTime() + tzOffsetMinutes * 60_000);
}

function toUtcDateFromTzMs(tzMs: number, tzOffsetMinutes: number) {
  return new Date(tzMs - tzOffsetMinutes * 60_000);
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function toYmd(dateUtc: Date) {
  const y = dateUtc.getUTCFullYear();
  const m = pad2(dateUtc.getUTCMonth() + 1);
  const d = pad2(dateUtc.getUTCDate());
  return `${y}-${m}-${d}`;
}

function decimalToNumber(value: unknown) {
  if (value === null || value === undefined) return null;
  return (value as any).toNumber ? (value as any).toNumber() : Number(value);
}

function parseDateOnly(input: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  return { year, month, day };
}

@Injectable()
export class AnnualService {
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

  private buildYearRange(year: number, tzOffsetMinutes: number) {
    const fromTzMs = Date.UTC(year, 0, 1, 0, 0, 0, 0);
    const toTzMs = Date.UTC(year + 1, 0, 1, 0, 0, 0, 0);
    return {
      from: toUtcDateFromTzMs(fromTzMs, tzOffsetMinutes),
      to: toUtcDateFromTzMs(toTzMs, tzOffsetMinutes),
    };
  }

  async listAnnualEntries(userId: string, companyId: string, query: ListAnnualQueryDto): Promise<AnnualRow[]> {
    await this.assertCompanyAccess(userId, companyId);

    const tzOffsetMinutes = parseTzOffsetMinutes(query.tzOffsetMinutes);
    if (tzOffsetMinutes === null) {
      throw new BadRequestException('Invalid `tzOffsetMinutes`');
    }

    const year = query.year ?? new Date().getUTCFullYear();
    const { from, to } = this.buildYearRange(year, tzOffsetMinutes);

    const manualEntries = await this.prisma.annualEntry.findMany({
      where: {
        companyId,
        date: {
          gte: from,
          lt: to,
        },
      },
      orderBy: { date: 'asc' },
    });

    const manualByDate = new Map<string, AnnualRow>();
    for (const entry of manualEntries) {
      const dateKey = toYmd(toTzDate(entry.date, tzOffsetMinutes));
      manualByDate.set(dateKey, {
        id: entry.id,
        date: dateKey,
        revenue: decimalToNumber(entry.revenue),
        expenses: decimalToNumber(entry.expenses),
        startingCapital: decimalToNumber(entry.startingCapital),
        total: decimalToNumber(entry.total),
        itemsSold: entry.itemsSold ?? null,
        profit: decimalToNumber(entry.profit),
        source: 'MANUAL',
      });
    }

    const lines = await this.prisma.salesCardLine.findMany({
      where: {
        salesCard: {
          companyId,
          status: { in: ['SUBMITTED', 'LOCKED'] },
          endAt: { gte: from, lt: to },
        },
      },
      select: {
        quantitySold: true,
        total: true,
        unitPrice: true,
        salesCard: {
          select: {
            startAt: true,
            endAt: true,
          },
        },
        item: {
          select: {
            costPrice: true,
          },
        },
      },
    });

    const autoByDate = new Map<string, { revenue: number; itemsSold: number; cost: number }>();
    for (const line of lines) {
      const endAt = line.salesCard.endAt ?? line.salesCard.startAt;
      const dateKey = toYmd(toTzDate(endAt, tzOffsetMinutes));
      const bucket = autoByDate.get(dateKey) ?? { revenue: 0, itemsSold: 0, cost: 0 };

      const total = line.total !== null && line.total !== undefined ? decimalToNumber(line.total) : null;
      const unitPrice = line.unitPrice !== null && line.unitPrice !== undefined ? decimalToNumber(line.unitPrice) : null;
      const lineRevenue =
        total !== null ? total : unitPrice !== null ? unitPrice * line.quantitySold : 0;

      const costPrice = line.item?.costPrice ? decimalToNumber(line.item.costPrice) : null;
      const lineCost = costPrice !== null ? costPrice * line.quantitySold : 0;

      bucket.revenue += lineRevenue;
      bucket.itemsSold += line.quantitySold;
      bucket.cost += lineCost;
      autoByDate.set(dateKey, bucket);
    }

    const rows: AnnualRow[] = [];
    for (const [date, entry] of manualByDate.entries()) {
      rows.push(entry);
    }
    for (const [date, bucket] of autoByDate.entries()) {
      if (manualByDate.has(date)) continue;
      rows.push({
        id: null,
        date,
        revenue: bucket.revenue,
        expenses: null,
        startingCapital: null,
        total: null,
        itemsSold: bucket.itemsSold,
        profit: bucket.revenue - bucket.cost,
        source: 'AUTO',
      });
    }

    rows.sort((a, b) => a.date.localeCompare(b.date));
    return rows;
  }

  async createAnnualEntry(userId: string, companyId: string, input: CreateAnnualEntryDto) {
    await this.assertCompanyAccess(userId, companyId);

    const tzOffsetMinutes = parseTzOffsetMinutes(input.tzOffsetMinutes);
    if (tzOffsetMinutes === null) {
      throw new BadRequestException('Invalid `tzOffsetMinutes`');
    }

    const parsed = parseDateOnly(input.date);
    if (!parsed) {
      throw new BadRequestException('Invalid `date` format');
    }

    const { year, month, day } = parsed;
    const dateUtc = toUtcDateFromTzMs(Date.UTC(year, month - 1, day, 0, 0, 0, 0), tzOffsetMinutes);

    const toDecimal = (value?: number) =>
      value === null || value === undefined ? null : new Prisma.Decimal(String(value));

    const payload = {
      revenue: toDecimal(input.revenue),
      expenses: toDecimal(input.expenses),
      startingCapital: toDecimal(input.startingCapital),
      total: toDecimal(input.total),
      itemsSold: input.itemsSold ?? null,
      profit: input.profit === undefined ? null : toDecimal(input.profit),
      note: input.note?.trim() ?? null,
    };

    return this.prisma.annualEntry.upsert({
      where: { companyId_date: { companyId, date: dateUtc } },
      create: {
        companyId,
        date: dateUtc,
        ...payload,
      },
      update: payload,
    });
  }

  async deleteAnnualEntry(userId: string, companyId: string, entryId: string) {
    await this.assertCompanyAccess(userId, companyId);

    const entry = await this.prisma.annualEntry.findFirst({
      where: { id: entryId, companyId },
    });
    if (!entry) {
      throw new NotFoundException('Annual entry not found');
    }
    return this.prisma.annualEntry.delete({ where: { id: entry.id } });
  }
}
