import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../lib/auth';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Required for Better Auth
  });

  const trustedOrigins =
    process.env.TRUSTED_ORIGINS?.split(',')
      .map((v) => v.trim())
      .filter(Boolean) ?? [];

  app.enableCors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (trustedOrigins.length === 0) return callback(null, true);
      return callback(null, trustedOrigins.includes(origin));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const basePath = auth.options.basePath ?? '/api/auth';
  app.getHttpAdapter().getInstance().use(basePath, toNodeHandler(auth));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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
