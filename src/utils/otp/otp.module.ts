import { Module } from '@nestjs/common';
import { OTPService } from './otp.service';
import { JwtModule } from '@nestjs/jwt';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [JwtModule, CacheModule.register(), ConfigModule],
  providers: [OTPService],
  exports: [OTPService],
})
export class OTPModule {}