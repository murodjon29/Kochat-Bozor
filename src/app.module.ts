import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OTPModule } from './utils/otp/otp.module';
import { CacheModule } from '@nestjs/cache-manager';
import { UserModule } from './user/user.module';
import { UserAuthModule } from './user/auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { AdminAuthModule } from './admin/auth/auth.module';
import { EmailModule } from './email/email.module';
import { SallerModule } from './saller/saller.module';
import { SallerAuthModule } from './saller/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({ ttl: 300, max: 100 }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: +configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    UserModule,
    OTPModule,
    UserAuthModule,
    AdminModule,
    AdminAuthModule,
    SallerModule,
    SallerAuthModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
