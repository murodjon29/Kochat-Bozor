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
import { Saller } from './saller/entities/saller.entity';
import { User } from './user/entities/user.entity';
import { Admin } from './admin/entities/admin.entity';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ProductImage } from './saller/entities/image.entitiy';
import { Product } from './saller/entities/product.entiti';
import { CategoryModule } from './category/category.module';
import { Category } from './category/entities/category.entity';
import { OrderModule } from './order/order.module';
import { Order } from './order/entities/order.entity';

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
        entities: [Saller, Product, ProductImage, User, Admin, Category, Order],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'images'),
      serveRoot: '/images',
    }),
    CategoryModule,
    UserModule,
    OTPModule,
    UserAuthModule,
    AdminModule,
    AdminAuthModule,
    SallerModule,
    SallerAuthModule,
    EmailModule,
    CategoryModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
