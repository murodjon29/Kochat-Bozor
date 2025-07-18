import {
  BadRequestException,
  Injectable,
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

interface UserLoginDto {
  email: string;
  password: string;
  otp?: string;
}

@Injectable()
export class UserAuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
    private otpService: OTPService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!user) throw new UnauthorizedException('Email mavjud emas');
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Notogri malumotlar');
    return { id: user.id, email: user.email, role: user.role || Role.USER, accountStatus: user.accountStatus };
  }

  async login(dto: UserLoginDto) {
    const { email, password, otp } = dto;
    const user = await this.validateUser(email, password);

    if (user.accountStatus === 'unverified') {
      if (!otp) {
        return {
          message: 'Hisobingiz tasdiqlanmagan. Iltimos, OTP kodini kiriting',
        };
      }
      await this.verifyToken(user.id, otp);
    }

    const payload = { id: user.id, email: user.email, role: user.role || Role.USER };
    console.log('User JWT payload:', payload); // Debug uchun
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

  async verifyToken(userId: number, token: string) {
    try {
      await this.otpService.validateUserOTP(userId, token);
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) throw new UnauthorizedException('Foydalanuvchi topilmadi');
      user.accountStatus = 'verified';
      await this.userRepository.save(user);
      console.log(`User ${userId} verified successfully`);
    } catch (error) {
      throw new BadRequestException(`OTP tasdiqlashda xato: ${error.message}`);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<string> {
    try {
      const { id: userId } = await this.otpService.validateResetPassword(token);
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) throw new BadRequestException('Foydalanuvchi topilmadi');
      user.password = await bcrypt.hash(newPassword, 10);
      await this.userRepository.save(user);
      return 'Parol muvaffaqiyatli tiklandi';
    } catch (error) {
      throw new BadRequestException(`Parolni tiklashda xato: ${error.message}`);
    }
  }
}