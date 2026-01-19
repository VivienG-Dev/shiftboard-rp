import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../lib/auth';
import * as express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Required for Better Auth
  });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.disable('x-powered-by');
  app.use(helmet());

  const trustedOrigins =
    process.env.TRUSTED_ORIGINS?.split(',')
      .map((v) => v.trim())
      .filter(Boolean) ?? [];

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && trustedOrigins.length === 0) {
    throw new Error('TRUSTED_ORIGINS must be set when NODE_ENV=production');
  }

  app.enableCors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (trustedOrigins.length === 0) return callback(null, true);
      if (trustedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const basePath = auth.options.basePath ?? '/api/auth';

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many requests' },
  });

  const authSensitiveLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many requests' },
  });

  expressApp.use(basePath, (req, res, next) => {
    const path = (req as { path?: string }).path ?? '';
    if (
      path.startsWith('/sign-in') ||
      path.startsWith('/sign-up') ||
      path.startsWith('/request-password-reset') ||
      path.startsWith('/reset-password')
    ) {
      return authSensitiveLimiter(req, res, next);
    }
    return authLimiter(req, res, next);
  });
  expressApp.use(basePath, toNodeHandler(auth));

  const jsonBodyLimit = process.env.JSON_BODY_LIMIT ?? '1mb';
  const urlencodedBodyLimit = process.env.URLENCODED_BODY_LIMIT ?? '1mb';
  app.use(express.json({ limit: jsonBodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: urlencodedBodyLimit }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
