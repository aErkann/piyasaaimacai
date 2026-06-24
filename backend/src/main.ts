import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const origins = process.env.APP_DOMAIN ? ['http://localhost:8080', process.env.APP_DOMAIN] : ['http://localhost:8080'];
  app.enableCors({ origin: origins });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Admin panel static serving (backend/dist/ => ../.. => project root/admin/)
  const adminPath = join(__dirname, '..', '..', 'admin');
  app.useStaticAssets(adminPath, { prefix: '/admin' });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`PiyasaAI Backend running on port ${port}`);
  console.log(`Admin panel: http://localhost:${port}/admin`);
}
bootstrap();
