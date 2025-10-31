import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from '../src/utils/exceptions/all-exceptions.filter';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const awsServerlessExpress = require('aws-serverless-express');
const { createServer, proxy } = awsServerlessExpress;

const expressApp = express();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  await app.init();
}

bootstrap();

const server = createServer(expressApp);
export default (req: any, res: any) => proxy(server, req, res);
