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
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { SallerService } from 'src/saller/saller.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, User, Saller]),
    forwardRef(() => AdminAuthModule),
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
  providers: [AdminService, UserService, SallerService],
  exports: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}