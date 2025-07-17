import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { forwardRef } from '@nestjs/common';
import { AdminAuthModule } from './auth/auth.module';
import { OTPModule } from 'src/utils/otp/otp.module';
import { EmailModule } from 'src/email/email.module';
import { User } from 'src/user/entities/user.entity';
import { Saller } from 'src/saller/entities/saller.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, User, Saller]),
    forwardRef(() => AdminAuthModule),
    OTPModule,
    EmailModule,
  ],
  providers: [AdminService],
  exports: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
