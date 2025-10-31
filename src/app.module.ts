import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { OTPModule } from './utils/otp/otp.module';
import { UserModule } from './user/user.module';
import { UserAuthModule } from './user/auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { AdminAuthModule } from './admin/auth/auth.module';
import { EmailModule } from './email/email.module';
import { SallerModule } from './saller/saller.module';
import { SallerAuthModule } from './saller/auth/auth.module';
import { CategoryModule } from './category/category.module';
import { OrderModule } from './order/order.module';
import { LikeModule } from './like/like.module';

import { Saller } from './saller/entities/saller.entity';
import { Product } from './saller/entities/product.entiti';
import { ProductImage } from './saller/entities/image.entitiy';
import { User } from './user/entities/user.entity';
import { Admin } from './admin/entities/admin.entity';
import { Category } from './category/entities/category.entity';
import { Order } from './order/entities/order.entity';
import { Like } from './like/entities/like.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({ ttl: 300, max: 100 }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DB_URL'), // Aiven URL
        ssl: { rejectUnauthorized: false }, // self-signed sertifikatni qabul qilish
        entities: [
          Saller,
          Product,
          ProductImage,
          User,
          Admin,
          Category,
          Order,
          Like,
        ],
        synchronize: true, // dev muhit uchun, productionda ehtiyot bo‘ling
      }),
    }),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'images'),
      serveRoot: '/images',
    }),

    // Modules
    CategoryModule,
    UserModule,
    OTPModule,
    UserAuthModule,
    AdminModule,
    AdminAuthModule,
    SallerModule,
    SallerAuthModule,
    EmailModule,
    OrderModule,
    LikeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
