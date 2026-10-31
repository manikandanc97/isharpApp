import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import { createCorsOptions } from './cors.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  app.enableCors(createCorsOptions());
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
