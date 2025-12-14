import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import { SnapshotsService } from './snapshots.service';

@Controller('companies/:companyId/snapshots')
export class SnapshotsController {
  constructor(private readonly snapshotsService: SnapshotsService) {}

  @Post()
  async createSnapshot(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Body() body: CreateSnapshotDto,
  ) {
    return { data: await this.snapshotsService.createSnapshot(session.user.id, companyId, body) };
  }

  @Get()
  async listSnapshots(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
  ) {
    return { data: await this.snapshotsService.listSnapshots(session.user.id, companyId) };
  }

  @Get(':snapshotId')
  async getSnapshot(
    @Session() session: UserSession,
    @Param('companyId') companyId: string,
    @Param('snapshotId') snapshotId: string,
  ) {
    return { data: await this.snapshotsService.getSnapshot(session.user.id, companyId, snapshotId) };
  }
}

