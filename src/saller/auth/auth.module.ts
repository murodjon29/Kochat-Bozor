import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Saller } from '../entities/saller.entity';
import { SallerAuthService } from './auth.service';
import { SallerAuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OTPModule } from '../../utils/otp/otp.module';
import { forwardRef } from '@nestjs/common';
import { SallerModule } from '../saller.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Saller]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    OTPModule,
    forwardRef(() => SallerModule),
  ],
  controllers: [SallerAuthController],
  providers: [SallerAuthService],
})
export class SallerAuthModule {}
