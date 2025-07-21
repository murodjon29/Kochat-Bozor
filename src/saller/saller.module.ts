import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Saller } from './entities/saller.entity';
import { SallerService } from './saller.service';
import { SallerController } from './saller.controller';
import { forwardRef } from '@nestjs/common';
import { SallerAuthModule } from './auth/auth.module';
import { OTPModule } from 'src/utils/otp/otp.module';
import { EmailModule } from 'src/email/email.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FileModule } from 'src/utils/file/file.module';
import { FileService } from 'src/utils/file/file.service';
import { Product } from './entities/product.entiti';
import { ProductImage } from './entities/image.entitiy';
@Module({
  imports: [
    TypeOrmModule.forFeature([Saller, Product, ProductImage]),
    forwardRef(() => SallerAuthModule),
    OTPModule,
    EmailModule,
    FileModule,
    ConfigModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  providers: [SallerService, FileService],
  exports: [SallerService],
  controllers: [SallerController],
})
export class SallerModule {}
