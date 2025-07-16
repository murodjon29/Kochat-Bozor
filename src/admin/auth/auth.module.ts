import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { OTPModule } from 'src/otp/otp.module';
import { AdminModule } from '../admin.module';
import { Admin } from '../entities/admin.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    OTPModule,
    AdminModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AdminAuthModule {}
