import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

function generateInviteCode(length = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[randomInt(alphabet.length)];
  }
  return out;
}

function maskEmail(email: string) {
  const [user, domain] = email.split('@');
  if (!user || !domain) return '***';
  const visible = user.length <= 2 ? user.charAt(0) : user.slice(0, 2);
  return `${visible}***@${domain}`;
}

@Injectable()
export class InvitesService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(InvitesService.name);

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
        const invite = await this.prisma.invite.create({
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
        this.logger.log(
          `Invite created user=${userId} company=${companyId} role=${roleId} email=${maskEmail(email)}`,
        );
        return invite;
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
    if (!invite || invite.company.archivedAt) {
      this.logger.warn(`Invite accept failed: not found user=${userId} code=${normalizedCode}`);
      throw new NotFoundException('Invite not found');
    }
    if (invite.status !== 'PENDING') {
      this.logger.warn(
        `Invite accept failed: status=${invite.status} user=${userId} company=${invite.companyId}`,
      );
      throw new BadRequestException('Invite is not pending');
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      this.logger.warn(
        `Invite accept failed: expired user=${userId} company=${invite.companyId} email=${maskEmail(invite.email)}`,
      );
      throw new BadRequestException('Invite has expired');
    }
    if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      this.logger.warn(
        `Invite accept failed: email mismatch user=${userId} company=${invite.companyId} inviteEmail=${maskEmail(invite.email)} userEmail=${maskEmail(userEmail)}`,
      );
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

      this.logger.log(
        `Invite accepted user=${userId} company=${invite.companyId} role=${invite.roleId} email=${maskEmail(userEmail)}`,
      );
      return { membershipId: membership.id, companyId: invite.companyId, roleId: invite.roleId };
    });
  }
}
