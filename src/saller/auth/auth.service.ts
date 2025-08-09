import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Saller } from '../entities/saller.entity';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { OTPService } from 'src/utils/otp/otp.service';
import { Role } from 'src/utils/enum';
import { ConfigService } from '@nestjs/config';
import { ConfirmSigninDto } from './dto/confirim-signin.dto';
import { OTPType } from 'src/utils/otp/types/otp-type';
import { EmailService } from 'src/email/email.service';

interface SallerLoginDto {
  email: string;
  password: string;
}

@Injectable()
export class SallerAuthService {
  constructor(
    @InjectRepository(Saller) private sallerRepository: Repository<Saller>,
    private jwtService: JwtService,
    private otpService: OTPService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async validateSaller(email: string, password: string): Promise<Saller> {
    const saller = await this.sallerRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!saller) {
      throw new UnauthorizedException('Email mavjud emas');
    }

    const isMatch = await bcrypt.compare(password, saller.password);
    if (!isMatch) {
      throw new UnauthorizedException('Noto‘g‘ri ma’lumotlar');
    }

    return saller;
  }

  async login(dto: SallerLoginDto) {
    const { email, password } = dto;
    const saller = await this.validateSaller(email, password);

    if (saller.accountStatus === 'unverified') {
      return {
        message:
          'Hisobingiz tasdiqlanmagan. Iltimos, hisobni email orqali tasdiqlang.',
        email: saller.email,
      };
    }

    const payload = {
      id: saller.id,
      email: saller.email,
      role: saller.role || Role.SALLER,
    };

    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1h',
      }),
      userId: saller.id,
      email: saller.email,
      role: saller.role,
    };
  }

  async confirmSignin(confirmSigninDto: ConfirmSigninDto) {
    try {
      const { email, otp } = confirmSigninDto;
      const saller = await this.sallerRepository.findOne({
        where: { email: email.toLowerCase() },
      });

      if (!saller) {
        throw new UnauthorizedException('Email topilmadi');
      }

      await this.otpService.validateSallerOTP(saller.id, otp);

      saller.accountStatus = 'verified';
      await this.sallerRepository.save(saller);

      const payload = {
        id: saller.id,
        email: saller.email,
        role: saller.role || Role.SALLER,
      };

      const token = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1h',
      });

      return {
        message: 'Hisobingiz muvaffaqiyatli tasdiqlandi.',
        access_token: token,
        userId: saller.id,
        email: saller.email,
        role: saller.role,
      };
    } catch (error) {
      throw new BadRequestException(`Tasdiqlashda xato: ${error.message}`);
    }
  }

  async forgotPassword(email: string) {
    const saller = await this.sallerRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!saller) throw new NotFoundException('Email topilmadi');

    const otp = await this.otpService.generateTokenForSaller(saller.id, OTPType.OTP);

    await this.emailService.sendEmail({
      subject: 'Parolni tiklash',
      recipients: [saller.email],
      html: `Parolingizni tiklash uchun quyidagi code dan foydalaning: <strong>${otp}</strong>`,
    })
    return { message: 'OTP emailga yuborildi', otp: process.env.NODE_ENV === 'dev' ? otp : undefined }
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const saller = await this.sallerRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!saller) throw new NotFoundException('Email topilmadi');

    const isValid = await this.otpService.validateSallerOTP(saller.id, otp);
    if (!isValid) throw new BadRequestException('Noto‘g‘ri yoki eskirgan OTP');

    saller.password = await bcrypt.hash(newPassword, 10);
    await this.sallerRepository.save(saller);

    return { message: 'Parol muvaffaqiyatli yangilandi' };
  }
}
