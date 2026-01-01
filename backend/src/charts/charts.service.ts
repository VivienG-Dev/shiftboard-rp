import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import type { Prisma, SalesCardStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type Bucket = 'hour' | 'day' | 'month';
type Interval = 'hour';

type DateRangeQuery = {
  from?: string;
  to?: string;
  tzOffsetMinutes?: string;
};

export type SalesByHourRow = {
  hour: number;
  revenue: number;
  itemsSold: number;
};

export type SalesByDayRow = {
  day: string; // YYYY-MM-DD
  revenue: number;
  itemsSold: number;
};

export type SalesByMonthRow = {
  month: string; // YYYY-MM
  revenue: number;
  itemsSold: number;
};

export type SalesTimeseriesRow = {
  ts: string; // bucket start (ISO)
  revenue: number;
  itemsSold: number;
};

function parseOptionalIsoDate(input?: string) {
  if (!input) return undefined;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function parseTzOffsetMinutes(input?: string) {
  if (!input) return 0;
  const n = Number(input);
  if (!Number.isInteger(n)) return null;
  // keep it sane: UTC-14 to UTC+14
  if (n < -14 * 60 || n > 14 * 60) return null;
  return n;
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

function toYm(dateUtc: Date) {
  const y = dateUtc.getUTCFullYear();
  const m = pad2(dateUtc.getUTCMonth() + 1);
  return `${y}-${m}`;
}

function decimalToNumber(value: unknown) {
  if (value === null || value === undefined) return 0;
  // Prisma Decimal has .toNumber()
  return (value as any).toNumber ? (value as any).toNumber() : Number(value);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function clampBucketCount(count: number, max: number) {
  return Math.min(Math.max(count, 0), max);
}

@Injectable()
export class ChartsService {
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

  private buildSalesCardWhere(
    companyId: string,
    from?: Date,
    to?: Date,
    dateField: 'startAt' | 'endAt' = 'endAt',
    statusIn: SalesCardStatus[] = ['SUBMITTED', 'LOCKED'],
  ): Prisma.SalesCardWhereInput {
    return {
      companyId,
      status: { in: statusIn },
      ...(from || to
        ? {
            [dateField]: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };
  }

  private async parseQuery(query: DateRangeQuery) {
    const from = parseOptionalIsoDate(query.from);
    const to = parseOptionalIsoDate(query.to);
    if (query.from && !from) throw new BadRequestException('Invalid `from` date');
    if (query.to && !to) throw new BadRequestException('Invalid `to` date');
    if (from && to && from.getTime() > to.getTime()) {
      throw new BadRequestException('`from` cannot be after `to`');
    }

    const tzOffsetMinutes = parseTzOffsetMinutes(query.tzOffsetMinutes);
    if (tzOffsetMinutes === null) {
      throw new BadRequestException('Invalid `tzOffsetMinutes`');
    }

    return { from, to, tzOffsetMinutes };
  }

  private async listLines(companyId: string, query: DateRangeQuery) {
    const { from, to, tzOffsetMinutes } = await this.parseQuery(query);

    // For analytics, we bucket by `endAt` (when the shift is submitted) rather than `startAt`.
    const salesCardWhere = this.buildSalesCardWhere(companyId, from, to, 'endAt');

    const lines = await this.prisma.salesCardLine.findMany({
      where: { salesCard: salesCardWhere },
      select: {
        quantitySold: true,
        total: true,
        salesCard: { select: { startAt: true, endAt: true } },
      },
    });

    return { from, to, tzOffsetMinutes, lines };
  }

  private async listSalesCardsWithLines(companyId: string, query: DateRangeQuery) {
    const { from, to, tzOffsetMinutes } = await this.parseQuery(query);

    const salesCardWhere = this.buildSalesCardWhere(companyId, from, to, 'endAt');

    const cards = await this.prisma.salesCard.findMany({
      where: salesCardWhere,
      select: {
        startAt: true,
        endAt: true,
        lines: { select: { quantitySold: true, total: true } },
      },
    });

    return { tzOffsetMinutes, cards };
  }

  private nextHourBoundaryUtcMs(ms: number) {
    const d = new Date(ms);
    d.setUTCMinutes(0, 0, 0);
    d.setUTCHours(d.getUTCHours() + 1);
    return d.getTime();
  }

  private floorToHourUtcMs(ms: number) {
    const d = new Date(ms);
    d.setUTCMinutes(0, 0, 0);
    return d.getTime();
  }

  private ceilToHourUtcMs(ms: number) {
    const floored = this.floorToHourUtcMs(ms);
    return floored === ms ? ms : this.nextHourBoundaryUtcMs(ms);
  }

  async getSalesByHour(userId: string, companyId: string, query: DateRangeQuery) {
    await this.assertCompanyAccess(userId, companyId);
    const { tzOffsetMinutes, cards } = await this.listSalesCardsWithLines(companyId, query);

    const buckets: SalesByHourRow[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      revenue: 0,
      itemsSold: 0,
    }));

    // Distribute each shift across its duration to avoid "spikes" at the start hour.
    for (const card of cards) {
      const startAt = card.startAt;
      const endAt = card.endAt ?? card.startAt;

      const startMs = startAt.getTime() + tzOffsetMinutes * 60_000;
      const endMs = endAt.getTime() + tzOffsetMinutes * 60_000;

      const durationMs = Math.max(endMs - startMs, 1);
      const totalRevenue = card.lines.reduce((sum, l) => sum + decimalToNumber(l.total), 0);
      const totalItemsSold = card.lines.reduce((sum, l) => sum + (l.quantitySold ?? 0), 0);

      let cursor = startMs;
      while (cursor < endMs) {
        const nextBoundary = Math.min(this.nextHourBoundaryUtcMs(cursor), endMs);
        const segmentMs = nextBoundary - cursor;
        const fraction = segmentMs / durationMs;

        const hour = new Date(cursor).getUTCHours();
        buckets[hour].revenue += totalRevenue * fraction;
        buckets[hour].itemsSold += totalItemsSold * fraction;

        cursor = nextBoundary;
      }

      // If end == start (very short), count it in the start hour.
      if (endMs === startMs) {
        const hour = new Date(startMs).getUTCHours();
        buckets[hour].revenue += totalRevenue;
        buckets[hour].itemsSold += totalItemsSold;
      }
    }

    return buckets;
  }

  async getSalesTimeseries(
    userId: string,
    companyId: string,
    interval: Interval,
    query: DateRangeQuery,
  ) {
    if (interval !== 'hour') {
      throw new BadRequestException('Invalid `interval` (hour)');
    }

    await this.assertCompanyAccess(userId, companyId);
    const { from, to, tzOffsetMinutes } = await this.parseQuery(query);

    if (!from || !to) {
      throw new BadRequestException('`from` and `to` are required for time-series');
    }

    const fromTzMs = from.getTime() + tzOffsetMinutes * 60_000;
    const toTzMs = to.getTime() + tzOffsetMinutes * 60_000;
    if (fromTzMs >= toTzMs) {
      throw new BadRequestException('`from` cannot be after `to`');
    }

    const startTzMs = this.floorToHourUtcMs(fromTzMs);
    const endTzMs = this.ceilToHourUtcMs(toTzMs);

    const bucketCount = clampBucketCount(
      Math.floor((endTzMs - startTzMs) / 3_600_000),
      800,
    );
    if (bucketCount <= 0) return [];

    const buckets: Array<{ tsTzMs: number; revenue: number; itemsSold: number }> = Array.from(
      { length: bucketCount },
      (_, i) => ({
        tsTzMs: startTzMs + i * 3_600_000,
        revenue: 0,
        itemsSold: 0,
      }),
    );

    const salesCardWhere = this.buildSalesCardWhere(companyId, from, to, 'endAt');
    const cards = await this.prisma.salesCard.findMany({
      where: salesCardWhere,
      select: {
        startAt: true,
        endAt: true,
        lines: { select: { quantitySold: true, total: true } },
      },
    });

    for (const card of cards) {
      const startAt = card.startAt;
      const endAt = card.endAt ?? card.startAt;

      const rawStartMs = startAt.getTime() + tzOffsetMinutes * 60_000;
      const rawEndMs = endAt.getTime() + tzOffsetMinutes * 60_000;

      const clippedStartMs = Math.max(rawStartMs, startTzMs);
      const clippedEndMs = Math.min(rawEndMs, endTzMs);
      if (clippedEndMs <= clippedStartMs) continue;

      const durationMs = Math.max(rawEndMs - rawStartMs, 1);
      const totalRevenue = card.lines.reduce((sum, l) => sum + decimalToNumber(l.total), 0);
      const totalItemsSold = card.lines.reduce((sum, l) => sum + (l.quantitySold ?? 0), 0);

      let cursor = clippedStartMs;
      while (cursor < clippedEndMs) {
        const nextBoundary = Math.min(this.nextHourBoundaryUtcMs(cursor), clippedEndMs);
        const segmentMs = nextBoundary - cursor;
        const fraction = segmentMs / durationMs;

        const index = Math.floor((cursor - startTzMs) / 3_600_000);
        const bucket = buckets[index];
        if (bucket) {
          bucket.revenue += totalRevenue * fraction;
          bucket.itemsSold += totalItemsSold * fraction;
        }

        cursor = nextBoundary;
      }
    }

    return buckets.map((b) => ({
      ts: toUtcDateFromTzMs(b.tsTzMs, tzOffsetMinutes).toISOString(),
      revenue: b.revenue,
      itemsSold: b.itemsSold,
    }));
  }

  async getSalesByDay(userId: string, companyId: string, query: DateRangeQuery) {
    await this.assertCompanyAccess(userId, companyId);
    const { from, to, tzOffsetMinutes, lines } = await this.listLines(companyId, query);

    const now = new Date();
    const start = from ?? addDays(now, -30);
    const end = to ?? now;

    const startTz = toTzDate(start, tzOffsetMinutes);
    const endTz = toTzDate(end, tzOffsetMinutes);

    const dayCount = clampBucketCount(
      Math.floor((endTz.getTime() - startTz.getTime()) / 86_400_000) + 1,
      400,
    );

    const buckets = new Map<string, SalesByDayRow>();
    for (let i = 0; i < dayCount; i++) {
      const day = toYmd(addDays(new Date(Date.UTC(startTz.getUTCFullYear(), startTz.getUTCMonth(), startTz.getUTCDate())), i));
      buckets.set(day, { day, revenue: 0, itemsSold: 0 });
    }

    for (const line of lines) {
      const stamp = line.salesCard.endAt ?? line.salesCard.startAt;
      const stampTz = toTzDate(stamp, tzOffsetMinutes);
      const day = toYmd(stampTz);
      const bucket = buckets.get(day);
      if (!bucket) continue;
      bucket.itemsSold += line.quantitySold ?? 0;
      bucket.revenue += decimalToNumber(line.total);
    }

    return Array.from(buckets.values()).sort((a, b) => a.day.localeCompare(b.day));
  }

  async getSalesByMonth(userId: string, companyId: string, query: DateRangeQuery) {
    await this.assertCompanyAccess(userId, companyId);
    const { from, to, tzOffsetMinutes, lines } = await this.listLines(companyId, query);

    const now = new Date();
    const start = from ?? addMonths(now, -12);
    const end = to ?? now;

    const startTz = toTzDate(start, tzOffsetMinutes);
    const endTz = toTzDate(end, tzOffsetMinutes);

    const monthCount = clampBucketCount(
      (endTz.getUTCFullYear() - startTz.getUTCFullYear()) * 12 +
        (endTz.getUTCMonth() - startTz.getUTCMonth()) +
        1,
      120,
    );

    const buckets = new Map<string, SalesByMonthRow>();
    const cursor = new Date(Date.UTC(startTz.getUTCFullYear(), startTz.getUTCMonth(), 1));
    for (let i = 0; i < monthCount; i++) {
      const key = toYm(addMonths(cursor, i));
      buckets.set(key, { month: key, revenue: 0, itemsSold: 0 });
    }

    for (const line of lines) {
      const stamp = line.salesCard.endAt ?? line.salesCard.startAt;
      const stampTz = toTzDate(stamp, tzOffsetMinutes);
      const month = toYm(stampTz);
      const bucket = buckets.get(month);
      if (!bucket) continue;
      bucket.itemsSold += line.quantitySold ?? 0;
      bucket.revenue += decimalToNumber(line.total);
    }

    return Array.from(buckets.values()).sort((a, b) => a.month.localeCompare(b.month));
  }

  async getSales(
    userId: string,
    companyId: string,
    bucket: Bucket,
    query: DateRangeQuery,
  ) {
    if (bucket === 'hour') return this.getSalesByHour(userId, companyId, query);
    if (bucket === 'day') return this.getSalesByDay(userId, companyId, query);
    return this.getSalesByMonth(userId, companyId, query);
  }
}
