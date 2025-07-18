import { BadRequestException, Injectable } from '@nestjs/common';
import { OTPType } from './types/otp-type';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Role } from '../enum';

@Injectable()
export class OTPService {
  private otpArray: {
    id: number;
    role: Role;
    otp: string;
    expiresAt: number;
  }[] = [];

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateTokenForUser(userId: number, type: OTPType): Promise<string> {
    return this.generateToken(userId, Role.USER, type);
  }

  async generateTokenForAdmin(adminId: number, type: OTPType): Promise<string> {
    return this.generateToken(adminId, Role.ADMIN, type);
  }

  async generateTokenForSaller(sallerId: number, type: OTPType): Promise<string> {
    return this.generateToken(sallerId, Role.SALLER, type);
  }

  private async generateToken(id: number, role: Role, type: OTPType): Promise<string> {
    try {
      if (type === OTPType.OTP) {
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = Date.now() + 3600 * 1000; // 1 soatlik TTL
        this.otpArray.push({ id, role, otp, expiresAt });
        console.log(`Generated OTP for ${role}-id-${id}: ${otp}`);
        return otp;
      } else if (type === OTPType.RESET_LINK) {
        const token = this.jwtService.sign(
          { id, role },
          {
            secret: this.configService.get<string>('JWT_RESET_SECRET'),
            expiresIn: '15m',
          },
        );
        console.log(`Generated reset token for ${role}-id-${id}`);
        return token;
      }
      throw new BadRequestException('Notogri OTP turi');
    } catch (error) {
      throw new BadRequestException(`Token yaratishda xato: ${error.message}`);
    }
  }

  async validateUserOTP(userId: number, enteredOtp: string): Promise<boolean> {
    return this.validateOTP(userId, Role.USER, enteredOtp);
  }

  async validateAdminOTP(adminId: number, enteredOtp: string): Promise<boolean> {
    return this.validateOTP(adminId, Role.ADMIN, enteredOtp);
  }

  async validateSallerOTP(sallerId: number, enteredOtp: string): Promise<boolean> {
    return this.validateOTP(sallerId, Role.SALLER, enteredOtp);
  }

  private async validateOTP(id: number, role: Role, enteredOtp: string): Promise<boolean> {
    try {
      const currentTime = Date.now();
      const otpEntry = this.otpArray.find(
        (entry) =>
          entry.id === id &&
          entry.role === role &&
          entry.otp === enteredOtp &&
          entry.expiresAt > currentTime,
      );

      if (!otpEntry) {
        console.log(`OTP validation failed for ${role}-id-${id}: OTP expired or not found`);
        throw new BadRequestException('OTP muddati tugagan yoki topilmadi');
      }

      this.otpArray = this.otpArray.filter(
        (entry) =>
          !(entry.id === id && entry.role === role && entry.otp === enteredOtp),
      );
      console.log(`OTP validated and removed for ${role}-id-${id}`);
      return true;
    } catch (error) {
      throw new BadRequestException(`OTP tekshirishda xato: ${error.message}`);
    }
  }

  async validateResetPassword(token: string): Promise<{ id: number; role: Role }> {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_RESET_SECRET'),
      });
      console.log(`Validated reset token for ${decoded.role}-id-${decoded.id}`);
      return { id: decoded.id, role: decoded.role };
    } catch (error) {
      console.log(`Reset token validation failed: ${error.message}`);
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Parolni tiklash tokeni muddati tugagan. Yangisini sorang');
      }
      throw new BadRequestException('Notogri parolni tiklash tokeni');
    }
  }
}