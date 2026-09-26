import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { Express } from 'express';
import { AppModule } from './app.module.js';

const app = await NestFactory.create(AppModule);
const server: Express = app.getHttpAdapter().getInstance();
server.set('trust proxy', 1);
await app.listen(readPort(process.env.PORT));

function readPort(value: string | undefined): number {
  const port = Number(value ?? 3001);
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : 3001;
}
