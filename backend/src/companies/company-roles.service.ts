import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PERMISSION_ALLOWLIST } from '../auth/permissions';

function slugifyKey(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

@Injectable()
export class CompanyRolesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCompanyAccess(userId: string, companyId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, companyId, archivedAt: null },
      include: { company: { select: { archivedAt: true } } },
    });
    if (!membership || membership.company.archivedAt) {
      throw new ForbiddenException('No access to this company');
    }
  }

  async listRoles(userId: string, companyId: string) {
    await this.assertCompanyAccess(userId, companyId);
    return this.prisma.companyRole.findMany({
      where: { companyId, archivedAt: null },
      orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async createRole(
    userId: string,
    companyId: string,
    input: { name: string; key?: string; permissions?: string[] },
  ) {
    await this.assertCompanyAccess(userId, companyId);

    const name = input.name?.trim();
    if (!name) throw new BadRequestException('Role name is required');

    const requested = input.permissions ?? [];
    const allow = new Set(PERMISSION_ALLOWLIST);
    const invalid = requested.filter((p) => !allow.has(p as any));
    if (invalid.length) {
      throw new BadRequestException(`Invalid permissions: ${invalid.join(', ')}`);
    }

    const baseKey = input.key?.trim() ? slugifyKey(input.key) : slugifyKey(name);
    const key = baseKey || undefined;
    if (!key) throw new BadRequestException('Role key is required');

    try {
      return await this.prisma.companyRole.create({
        data: { companyId, name, key, permissions: requested, isSystem: false },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A role with this key already exists');
      }
      throw e;
    }
  }

  async updateRole(
    userId: string,
    companyId: string,
    roleId: string,
    input: { name?: string; permissions?: string[] },
  ) {
    await this.assertCompanyAccess(userId, companyId);

    const role = await this.prisma.companyRole.findFirst({
      where: { id: roleId, companyId, archivedAt: null },
      select: { id: true, isSystem: true },
    });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new BadRequestException('System roles cannot be edited');

    const requested = input.permissions ?? undefined;
    if (requested) {
      const allow = new Set(PERMISSION_ALLOWLIST);
      const invalid = requested.filter((p) => !allow.has(p as any));
      if (invalid.length) {
        throw new BadRequestException(`Invalid permissions: ${invalid.join(', ')}`);
      }
    }

    return this.prisma.companyRole.update({
      where: { id: role.id },
      data: {
        name: input.name?.trim() || undefined,
        permissions: requested,
      },
    });
  }

  async archiveRole(userId: string, companyId: string, roleId: string) {
    await this.assertCompanyAccess(userId, companyId);

    const role = await this.prisma.companyRole.findFirst({
      where: { id: roleId, companyId, archivedAt: null },
      select: { id: true, isSystem: true },
    });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new BadRequestException('System roles cannot be archived');

    return this.prisma.companyRole.update({
      where: { id: role.id },
      data: { archivedAt: new Date() },
    });
  }
}
