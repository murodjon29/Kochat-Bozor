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

@Module({
  imports: [
    TypeOrmModule.forFeature([Saller]),
    forwardRef(() => SallerAuthModule),
    OTPModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  providers: [SallerService],
  exports: [SallerService],
  controllers: [SallerController],
})
export class SallerModule {}
