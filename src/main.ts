import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './utils/exceptions/all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import * as requestIp from 'request-ip';
import * as useragent from 'express-useragent';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());

  app.use(cookieParser());

  app.use(requestIp.mw());
  app.use(useragent.express());
  app.use((req: any, res, next) => {
    const ip = req.clientIp;
    const device = req.useragent;
    const time = new Date().toISOString();

    console.log('---- REQUEST LOG ----');
    console.log(`Time: ${time}`);
    console.log(`IP: ${ip}`);
    console.log(`Device: ${device.platform} - ${device.os} - ${device.browser}`);
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

  const configService = app.get(ConfigService);
  const port = Number(configService.get('API_PORT')) || 4000;

  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: ${port}`);
}
bootstrap();
