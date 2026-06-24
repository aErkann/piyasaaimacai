import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import express from 'express';

let cachedApp: NestExpressApplication | null = null;

async function createApp() {
  if (cachedApp) return cachedApp;

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const origins = process.env.APP_DOMAIN ? ['http://localhost:8080', process.env.APP_DOMAIN] : ['http://localhost:8080'];
  app.enableCors({ origin: origins });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const adminPath = join(__dirname, '..', '..', 'admin');
  app.useStaticAssets(adminPath, { prefix: '/admin' });

  await app.init();
  cachedApp = app;
  return app;
}

export default async function handler(req: any, res: any) {
  const app = await createApp();
  const instance = app.getHttpAdapter().getInstance();
  return instance(req, res);
}

// Local dev
if (!process.env.VERCEL) {
  async function bootstrap() {
    const app = await createApp();
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`PiyasaAI Backend running on port ${port}`);
    console.log(`Admin panel: http://localhost:${port}/admin`);
  }
  bootstrap();
}
