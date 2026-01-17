import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Resend } from 'resend';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const appName = process.env.APP_NAME ?? 'ShiftBoard RP';
const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
const resendFrom = process.env.RESEND_FROM ?? 'ShiftBoard RP <no-reply@shiftboard.local>';
const cookieDomain = process.env.COOKIE_DOMAIN;
export const auth = betterAuth({
  basePath: '/api/auth',
  trustedOrigins: (
    process.env.TRUSTED_ORIGINS?.split(',').map((v) => v.trim()).filter(Boolean) ??
    ['http://localhost:3000']
  ),
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      if (!resend) {
        console.warn('RESEND_API_KEY is not set; skipping verification email.');
        return;
      }

      const verifyUrl = new URL(url, frontendUrl);
      verifyUrl.searchParams.set('callbackURL', `${frontendUrl}/sign-in?verified=1`);
      await resend.emails.send({
        from: resendFrom,
        to: user.email,
        subject: `Confirme ton email - ${appName}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5">
            <h2>Bienvenue sur ${appName}</h2>
            <p>Confirme ton email pour activer ton compte.</p>
            <p>
              <a href="${verifyUrl.toString()}" style="display:inline-block;padding:10px 16px;background:#22d3ee;color:#0f172a;text-decoration:none;border-radius:8px;">
                Vérifier mon email
              </a>
            </p>
            <p>Si le bouton ne fonctionne pas, copie ce lien :</p>
            <p>${verifyUrl.toString()}</p>
          </div>
        `,
      });
    },
  },
  advanced: {
    useSecureCookies: frontendUrl.startsWith('https://'),
    ...(cookieDomain
      ? { crossSubDomainCookies: { enabled: true, domain: cookieDomain } }
      : {}),
  },
});
