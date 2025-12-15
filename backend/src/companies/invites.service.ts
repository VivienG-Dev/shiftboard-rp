import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

function generateInviteCode(length = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

@Injectable()
export class InvitesService {
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

  async createInvite(
    userId: string,
    companyId: string,
    input: { email: string; roleId: string; expiresInHours?: number },
  ) {
    await this.assertCompanyAccess(userId, companyId);

    const email = input.email.trim().toLowerCase();
    const roleId = input.roleId.trim();
    const expiresInHours = input.expiresInHours ?? 72;
    if (!email) throw new BadRequestException('Email is required');
    if (!roleId) throw new BadRequestException('roleId is required');

    const role = await this.prisma.companyRole.findFirst({
      where: { id: roleId, companyId, archivedAt: null },
      select: { id: true },
    });
    if (!role) throw new BadRequestException('Invalid roleId for this company');

    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateInviteCode(6);
      try {
        return await this.prisma.invite.create({
          data: {
            companyId,
            roleId,
            email,
            code,
            createdById: userId,
            expiresAt,
            status: 'PENDING',
            type: 'EMAIL_CODE',
          },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') continue;
        throw e;
      }
    }

    throw new ConflictException('Could not generate a unique invite code, retry');
  }

  async listInvites(userId: string, companyId: string) {
    await this.assertCompanyAccess(userId, companyId);
    return this.prisma.invite.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptInvite(userId: string, userEmail: string, code: string) {
    const normalizedCode = code.trim().toUpperCase();
    const invite = await this.prisma.invite.findFirst({
      where: { code: normalizedCode },
      include: { company: { select: { archivedAt: true } } },
    });
    if (!invite || invite.company.archivedAt) throw new NotFoundException('Invite not found');
    if (invite.status !== 'PENDING') throw new BadRequestException('Invite is not pending');
    if (invite.expiresAt.getTime() < Date.now()) throw new BadRequestException('Invite has expired');
    if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new ForbiddenException('Invite email does not match your account');
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.membership.findFirst({
        where: { userId, companyId: invite.companyId, archivedAt: null },
        select: { id: true },
      });
      if (existing) throw new ConflictException('You are already a member of this company');

      const membership = await tx.membership.create({
        data: {
          userId,
          companyId: invite.companyId,
          activeRoleId: invite.roleId,
        },
      });

      await tx.membershipRole.create({
        data: {
          membershipId: membership.id,
          roleId: invite.roleId,
        },
      });

      await tx.invite.update({
        where: { id: invite.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          acceptedById: userId,
        },
      });

      return { membershipId: membership.id, companyId: invite.companyId, roleId: invite.roleId };
    });
  }
}
