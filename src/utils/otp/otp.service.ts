import { BadRequestException, Injectable } from '@nestjs/common';
import { OTPType } from './types/otp-type';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class OTPService {
  private otpArray: {
    id: number;
    role: string;
    otp: string;
    expiresAt: number;
  }[] = [];

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateTokenForUser(userId: number, type: OTPType): Promise<string> {
    return this.generateToken(userId, 'user', type);
  }

  async generateTokenForAdmin(adminId: number, type: OTPType): Promise<string> {
    return this.generateToken(adminId, 'admin', type);
  }

  async generateTokenForSaller(
    sallerId: number,
    type: OTPType,
  ): Promise<string> {
    return this.generateToken(sallerId, 'saller', type);
  }

  private async generateToken(
    id: number,
    role: 'user' | 'admin' | 'saller',
    type: OTPType,
  ): Promise<string> {
    if (type === OTPType.OTP) {
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = Date.now() + 3600 * 1000; // 1 soatlik TTL
      this.otpArray.push({ id, role, otp, expiresAt });
      console.log(`Generated OTP for ${role}-otp-${id}: ${otp}`);
      return otp;
    } else if (type === OTPType.RESET_LINK) {
      const token = this.jwtService.sign(
        { id, role },
        {
          secret: this.configService.get<string>('JWT_RESET_SECRET'),
          expiresIn: '15m',
        },
      );
      return token;
    }
    throw new BadRequestException('Invalid OTP type');
  }

  async validateUserOTP(userId: number, enteredOtp: string): Promise<boolean> {
    return this.validateOTP(userId, 'user', enteredOtp);
  }

  async validateAdminOTP(
    adminId: number,
    enteredOtp: string,
  ): Promise<boolean> {
    return this.validateOTP(adminId, 'admin', enteredOtp);
  }

  async validateSallerOTP(
    sallerId: number,
    enteredOtp: string,
  ): Promise<boolean> {
    return this.validateOTP(sallerId, 'saller', enteredOtp);
  }

  private async validateOTP(
    id: number,
    role: 'user' | 'admin' | 'saller',
    enteredOtp: string,
  ): Promise<boolean> {
    const currentTime = Date.now();
    const otpEntry = this.otpArray.find(
      (entry) =>
        entry.id === id &&
        entry.role === role &&
        entry.otp === enteredOtp &&
        entry.expiresAt > currentTime,
    );

    if (!otpEntry) {
      throw new BadRequestException('OTP expired or not found');
    }

    this.otpArray = this.otpArray.filter(
      (entry) =>
        !(entry.id === id && entry.role === role && entry.otp === enteredOtp),
    );
    console.log(`OTP validated and removed for ${role}-otp-${id}`);
    return true;
  }

  async validateResetPassword(token: string): Promise<number> {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_RESET_SECRET'),
      });
      return decoded.id;
    } catch (error) {
      if (error.name === 'TokenExpiredError')
        throw new BadRequestException('Reset token expired. Request a new one');
      throw new BadRequestException('Invalid reset token');
    }
  }
}
