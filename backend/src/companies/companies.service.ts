import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { CompanyType } from '../../generated/prisma/client';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCompanyInput, CreateCompanyLocationInput } from './companies.types';

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

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
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async createCompany(userId: string, input?: CreateCompanyInput) {
    if (!input) {
      throw new BadRequestException('Request body is required');
    }
    const name = input.name?.trim();
    if (!name) {
      throw new BadRequestException('Company name is required');
    }

    const companyType: CompanyType = input.type ?? 'OTHER';

    const baseSlug = input.slug?.trim()
      ? slugify(input.slug)
      : slugify(name);
    const slug = baseSlug || undefined;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: {
            name,
            slug,
            type: companyType,
            ownerId: userId,
          },
        });

        const ownerRole = await tx.companyRole.create({
          data: {
            companyId: company.id,
            name: 'Owner',
            key: 'owner',
            permissions: [],
            isSystem: true,
          },
        });

        const membership = await tx.membership.create({
          data: {
            companyId: company.id,
            userId,
            activeRoleId: ownerRole.id,
          },
        });

        await tx.membershipRole.create({
          data: {
            membershipId: membership.id,
            roleId: ownerRole.id,
          },
        });

        return { company, membership, ownerRole };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const fields = extractUniqueConstraintFields(error);
        const field = fields.includes('slug') ? 'slug' : fields.includes('name') ? 'name' : fields[0];

        const message =
          field === 'slug'
            ? 'A company with this slug already exists'
            : field === 'name'
              ? 'You already have a company with this name'
              : 'A company with this name/slug already exists';

        throw new HttpException(
          {
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
            message,
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

  async listMyCompanies(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId, archivedAt: null },
      include: {
        company: {
          include: {
            locations: {
              where: { archivedAt: null },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return memberships
      .filter((m) => !m.company.archivedAt)
      .map((m) => m.company);
  }

  async createCompanyLocation(
    userId: string,
    companyId: string,
    input: CreateCompanyLocationInput,
  ) {
    await this.getCompany(userId, companyId);

    const name = input.name?.trim();
    if (!name) {
      throw new BadRequestException('Location name is required');
    }

    try {
      const location = await this.prisma.companyLocation.create({
        data: { companyId, name },
      });
      return location;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const fields = extractUniqueConstraintFields(error);
        const field = fields.includes('name') ? 'name' : fields[0];

        throw new HttpException(
          {
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
            message: 'A location with this name already exists for this company',
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

  async listCompanyLocations(userId: string, companyId: string) {
    await this.getCompany(userId, companyId);

    return this.prisma.companyLocation.findMany({
      where: { companyId, archivedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCompany(userId: string, companyId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, companyId, archivedAt: null },
      include: {
        company: {
          include: {
            locations: {
              where: { archivedAt: null },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!membership || membership.company.archivedAt) {
      throw new ForbiddenException('No access to this company');
    }

    return membership.company;
  }
}
