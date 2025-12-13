import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });
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
  },
});
