import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as requestIp from 'request-ip';
import * as useragent from 'express-useragent';
import { AppModule } from 'src/app.module';
import { AllExceptionsFilter } from 'src/utils/exceptions/all-exceptions.filter';

// aws-serverless-express require bilan
// eslint-disable-next-line @typescript-eslint/no-var-requires
import awsServerlessExpress from 'aws-serverless-express';
const { createServer, proxy } = awsServerlessExpress;

const expressApp = express();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(cookieParser());
  app.use(requestIp.mw());
  app.use(useragent.express());

  app.use((req: any, res: any, next: () => void) => {
    const ip = req.clientIp;
    const device = req.useragent;
    console.log('---- REQUEST LOG ----');
    console.log(`IP: ${ip}, Device: ${device.platform} - ${device.os} - ${device.browser}`);
    console.log(`URL: ${req.originalUrl}`);
    console.log('---------------------');
    next();
  });

  app.enableCors({ origin: '*' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: 422,
    }),
  );

  await app.init();
}

bootstrap();

const server = createServer(expressApp);
export default (req: any, res: any) => proxy(server, req, res);
