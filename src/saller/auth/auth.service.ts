import {
  BadRequestException,
  Injectable,
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

interface SallerLoginDto {
  email: string;
  password: string;
  otp?: string;
}

@Injectable()
export class SallerAuthService {
  constructor(
    @InjectRepository(Saller) private sallerRepository: Repository<Saller>,
    private jwtService: JwtService,
    private otpService: OTPService,
    private configService: ConfigService,
  ) {}

  async validateSaller(email: string, password: string): Promise<any> {
    const saller = await this.sallerRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!saller) throw new UnauthorizedException('Email mavjud emas');
    const passwordMatch = await bcrypt.compare(password, saller.password);
    if (!passwordMatch)
      throw new UnauthorizedException('Noto‘g‘ri ma’lumotlar');
    return {
      id: saller.id,
      email: saller.email,
      role: saller.role || Role.SALLER,
      accountStatus: saller.accountStatus,
    };
  }

  async login(dto: SallerLoginDto) {
    const { email, password, otp } = dto;
    const saller = await this.validateSaller(email, password);

    if (saller.accountStatus === 'unverified') {
      if (!otp) {
        return {
          message: 'Hisobingiz tasdiqlanmagan. Iltimos, OTP kodini kiriting',
        };
      }
      await this.verifyToken(saller.id, otp);
    }

    const payload = {
      id: saller.id,
      email: saller.email,
      role: saller.role || Role.SALLER,
    };
    console.log('Saller JWT payload:', payload);
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

  async verifyToken(sallerId: number, token: string) {
    try {
      await this.otpService.validateSallerOTP(sallerId, token);
      const saller = await this.sallerRepository.findOne({
        where: { id: sallerId },
      });
      if (!saller) throw new UnauthorizedException('Sotuvchi topilmadi');
      saller.accountStatus = 'verified';
      await this.sallerRepository.save(saller);
      console.log(`Saller ${sallerId} verified successfully`);
    } catch (error) {
      throw new BadRequestException(`OTP tasdiqlashda xato: ${error.message}`);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<string> {
    try {
      const { id: sallerId } =
        await this.otpService.validateResetPassword(token);
      const saller = await this.sallerRepository.findOne({
        where: { id: sallerId },
      });
      if (!saller) throw new BadRequestException('Sotuvchi topilmadi');
      saller.password = await bcrypt.hash(newPassword, 10);
      await this.sallerRepository.save(saller);
      return 'Parol muvaffaqiyatli tiklandi';
    } catch (error) {
      throw new BadRequestException(`Parolni tiklashda xato: ${error.message}`);
    }
  }
}
