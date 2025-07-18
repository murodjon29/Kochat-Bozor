import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../entities/admin.entity';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { OTPService } from 'src/utils/otp/otp.service';
import { Role } from 'src/utils/enum';
import { ConfigService } from '@nestjs/config';

interface AdminLoginDto {
  email: string;
  password: string;
  otp?: string;
}

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(Admin) private adminRepository: Repository<Admin>,
    private jwtService: JwtService,
    private otpService: OTPService,
    private configService: ConfigService,
  ) {}

  async validateAdmin(email: string, password: string): Promise<any> {
    const admin = await this.adminRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!admin) throw new UnauthorizedException('Email mavjud emas');
    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) throw new UnauthorizedException('Notogri ma’lumotlar');
    return { id: admin.id, email: admin.email, role: admin.role || Role.ADMIN, accountStatus: admin.accountStatus };
  }

  async login(dto: AdminLoginDto) {
    const { email, password, otp } = dto;
    const admin = await this.validateAdmin(email, password);

    if (admin.accountStatus === 'unverified') {
      if (!otp) {
        return {
          message: 'Hisobingiz tasdiqlanmagan. Iltimos, OTP kodini kiriting',
        };
      }
      await this.verifyToken(admin.id, otp);
    }

    const payload = { id: admin.id, email: admin.email, role: admin.role || Role.ADMIN };
    console.log('Admin JWT payload:', payload); // Debug uchun
    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1h',
      }),
      userId: admin.id,
      email: admin.email,
      role: admin.role,
    };
  }

  async verifyToken(adminId: number, token: string) {
    try {
      await this.otpService.validateAdminOTP(adminId, token);
      const admin = await this.adminRepository.findOne({ where: { id: adminId } });
      if (!admin) throw new UnauthorizedException('Admin topilmadi');
      admin.accountStatus = 'verified';
      await this.adminRepository.save(admin);
      console.log(`Admin ${adminId} verified successfully`);
    } catch (error) {
      throw new BadRequestException(`OTP tasdiqlashda xato: ${error.message}`);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<string> {
    try {
      const { id: adminId } = await this.otpService.validateResetPassword(token);
      const admin = await this.adminRepository.findOne({ where: { id: adminId } });
      if (!admin) throw new BadRequestException('Admin topilmadi');
      admin.password = await bcrypt.hash(newPassword, 10);
      await this.adminRepository.save(admin);
      return 'Parol muvaffaqiyatli tiklandi';
    } catch (error) {
      throw new BadRequestException(`Parolni tiklashda xato: ${error.message}`);
    }
  }
}