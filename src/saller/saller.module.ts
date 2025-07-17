import { Module } from '@nestjs/common';
   import { TypeOrmModule } from '@nestjs/typeorm';
   import { Saller } from './entities/saller.entity';
   import { SallerService } from './saller.service';
   import { SallerController } from './saller.controller';
   import { forwardRef } from '@nestjs/common';
   import { SallerAuthModule } from './auth/auth.module';
import { OTPModule } from 'src/utils/otp/otp.module';
import { EmailModule } from 'src/email/email.module';

   @Module({
     imports: [TypeOrmModule.forFeature([Saller]), forwardRef(() => SallerAuthModule), OTPModule, EmailModule],
     providers: [SallerService],
     exports: [SallerService],
     controllers: [SallerController],
   })
   export class SallerModule {}