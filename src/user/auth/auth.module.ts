import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity'; // User entity qo‘shildi
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OTPModule } from '../../utils/otp/otp.module';
import { forwardRef } from '@nestjs/common';
import { UserModule } from '../user.module';
import { UserAuthController } from './auth.controller';
import { UserAuthService } from './auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    OTPModule,
    forwardRef(() => UserModule),
  ],
  controllers: [UserAuthController],
  providers: [UserAuthService],
})
export class UserAuthModule {}
