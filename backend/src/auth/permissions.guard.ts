import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { PERMISSIONS_ANY_KEY, PERMISSIONS_KEY } from './permissions.constants';
import type { PermissionKey } from './permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}
  private readonly logger = new Logger(PermissionsGuard.name);

  async canActivate(context: ExecutionContext) {
    const requiredAll = this.reflector.getAllAndOverride<PermissionKey[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredAny = this.reflector.getAllAndOverride<PermissionKey[]>(PERMISSIONS_ANY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredAll?.length && !requiredAny?.length) return true;

    const request = context.switchToHttp().getRequest();
    const userId: string | undefined = request?.session?.user?.id ?? request?.user?.id;
    if (!userId) {
      const path = request?.path ?? '';
      const ip = request?.ip ?? '';
      this.logger.warn(`Unauthorized request path=${path} ip=${ip}`);
      throw new UnauthorizedException();
    }

    const companyId: string | undefined = request?.params?.companyId;
    if (!companyId) {
      const path = request?.path ?? '';
      this.logger.warn(`Missing companyId user=${userId} path=${path}`);
      throw new BadRequestException('Missing companyId for permission check');
    }

    const membership = await this.prisma.membership.findFirst({
      where: { userId, companyId, archivedAt: null },
      include: {
        company: { select: { ownerId: true, archivedAt: true } },
        membershipRoles: {
          include: { role: { select: { id: true, permissions: true, archivedAt: true } } },
        },
      },
    });

    if (!membership || membership.company.archivedAt) {
      this.logger.warn(`Forbidden: no company access user=${userId} company=${companyId}`);
      throw new ForbiddenException('No access to this company');
    }

    if (membership.company.ownerId === userId) {
      return true;
    }

    const permissions = new Set<string>();
    for (const mr of membership.membershipRoles) {
      if (!mr.role.archivedAt) {
        for (const p of mr.role.permissions ?? []) permissions.add(p);
      }
    }

    if (requiredAll?.length) {
      const missing = requiredAll.filter((p) => !permissions.has(p));
      if (missing.length) {
        this.logger.warn(
          `Forbidden: missing permissions user=${userId} company=${companyId} missing=${missing.join(',')}`,
        );
        throw new ForbiddenException(`Missing permissions: ${missing.join(', ')}`);
      }
    }

    if (requiredAny?.length) {
      const ok = requiredAny.some((p) => permissions.has(p));
      if (!ok) {
        this.logger.warn(
          `Forbidden: missing any permission user=${userId} company=${companyId} requiredAny=${requiredAny.join(',')}`,
        );
        throw new ForbiddenException(`Missing any permission of: ${requiredAny.join(', ')}`);
      }
    }

    return true;
  }
}
