import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { RequirePermissions } from '../auth/permissions.decorator';
import { ChartsService } from './charts.service';

@Controller('companies/:companyId/charts')
export class ChartsController {
  constructor(private readonly chartsService: ChartsService) {}

  @Get('sales-timeseries')
  @RequirePermissions('stats.read')
  async getSalesTimeseries(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Query('interval') interval?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tzOffsetMinutes') tzOffsetMinutes?: string,
  ) {
    const normalized = (interval ?? 'hour').toLowerCase();
    if (normalized !== 'hour') {
      throw new BadRequestException('Invalid `interval` (hour)');
    }
    return {
      data: await this.chartsService.getSalesTimeseries(session.user.id, companyId, 'hour', {
        from,
        to,
        tzOffsetMinutes,
      }),
    };
  }

  @Get('sales-by-hour')
  @RequirePermissions('stats.read')
  async getSalesByHour(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tzOffsetMinutes') tzOffsetMinutes?: string,
  ) {
    return {
      data: await this.chartsService.getSalesByHour(session.user.id, companyId, {
        from,
        to,
        tzOffsetMinutes,
      }),
    };
  }

  @Get('sales-by-day')
  @RequirePermissions('stats.read')
  async getSalesByDay(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tzOffsetMinutes') tzOffsetMinutes?: string,
  ) {
    return {
      data: await this.chartsService.getSalesByDay(session.user.id, companyId, {
        from,
        to,
        tzOffsetMinutes,
      }),
    };
  }

  @Get('sales-by-month')
  @RequirePermissions('stats.read')
  async getSalesByMonth(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tzOffsetMinutes') tzOffsetMinutes?: string,
  ) {
    return {
      data: await this.chartsService.getSalesByMonth(session.user.id, companyId, {
        from,
        to,
        tzOffsetMinutes,
      }),
    };
  }

  @Get('sales')
  @RequirePermissions('stats.read')
  async getSales(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Query('bucket') bucket?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tzOffsetMinutes') tzOffsetMinutes?: string,
  ) {
    const normalized = (bucket ?? 'hour').toLowerCase();
    if (!['hour', 'day', 'month'].includes(normalized)) {
      throw new BadRequestException('Invalid `bucket` (hour|day|month)');
    }
    return {
      data: await this.chartsService.getSales(
        session.user.id,
        companyId,
        normalized as 'hour' | 'day' | 'month',
        { from, to, tzOffsetMinutes },
      ),
    };
  }
}
