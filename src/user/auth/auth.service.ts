import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { OTPService } from 'src/utils/otp/otp.service';
import { Role } from 'src/utils/enum';
import { ConfigService } from '@nestjs/config';
import { ResetPasswordDto } from './dto/reset-password';
import { EmailService } from 'src/email/email.service';
import { OTPType } from 'src/utils/otp/types/otp-type';

interface UserLoginDto {
  email: string;
  password: string;
}

@Injectable()
export class UserAuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
    private otpService: OTPService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!user) throw new UnauthorizedException('Email mavjud emas');

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch)
      throw new UnauthorizedException('Noto‘g‘ri ma’lumotlar');

    return user;
  }

  async login(dto: UserLoginDto) {
    const { email, password } = dto;
    const user = await this.validateUser(email, password);

    if (user.accountStatus === 'unverified') {
      return {
        message:
          'Hisobingiz tasdiqlanmagan. Iltimos, confirm-signin orqali kodni tasdiqlang.',
        email: user.email,
      };
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role || Role.USER,
    };

    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1h',
      }),
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }

  async confirmSignin(email: string, otp: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { email: email.toLowerCase() },
      });

      if (!user) throw new UnauthorizedException('Email topilmadi');

      await this.otpService.validateUserOTP(user.id, otp);

      user.accountStatus = 'verified';
      await this.userRepository.save(user);

      const payload = {
        id: user.id,
        email: user.email,
        role: user.role || Role.USER,
      };

      const token = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1h',
      });

      return {
        message: 'Hisobingiz muvaffaqiyatli tasdiqlandi.',
        access_token: token,
        userId: user.id,
        email: user.email,
        role: user.role,
      };
    } catch (error) {
      throw new BadRequestException(`OTP tasdiqlashda xato: ${error.message}`);
    }
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) throw new NotFoundException('Email topilmadi');

    const otp = await this.otpService.generateTokenForUser(
      user.id,
      OTPType.OTP,
    );

    await this.emailService.sendEmail({
      subject: 'Parolni tiklash',
      recipients: [user.email],
      html: `Parolingizni tiklash uchun quyidagi code dan foydalaning: <strong>${otp}</strong>`,
    });
    return {
      message: 'OTP emailga yuborildi',
      otp: process.env.NODE_ENV === 'dev' ? otp : undefined,
    };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) throw new NotFoundException('Email topilmadi');

    const isValid = await this.otpService.validateUserOTP(user.id, otp);
    if (!isValid) throw new BadRequestException('Noto‘g‘ri yoki eskirgan OTP');

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    return { message: 'Parol muvaffaqiyatli yangilandi' };
  }
}
