import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { OTPService } from 'src/otp/otp.service';
import { Admin } from '../entities/admin.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
    private jwtService: JwtService,
    private readonly otpService: OTPService,
  ) {}

  async login(dto: LoginDto) {
    try {
      const { email, password, otp } = dto;

      const admin = await this.adminRepo.findOne({ where: { email } });
      if (!admin) {
        throw new UnauthorizedException('Email doesnt exist');
      }

      const passwordMatch = await bcrypt.compare(password, admin.password);
      if (!passwordMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (admin.accountStatus === 'unverified') {
        if (!otp) {
          return {
            message:
              'Your account is not verified.Please provide your otp to verify.',
          };
        } else {
          await this.verifyToken(admin.id, otp);
        }
      }

      const payload = { id: admin.id, email: admin.email };
      const accessToken = this.jwtService.sign(payload);

      return {
        accessToken,
        adminId: admin.id,
        email: admin.email,
      };
    } catch (err) {
      if (
        err instanceof UnauthorizedException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }
      throw new BadRequestException('Login failed');
    }
  }

  async verifyToken(adminId: number, token: string) {
    await this.otpService.validateOTP(adminId, token);

    const admin = await this.adminRepo.findOne({
      where: { id: adminId },
    });

    if (!admin) {
      throw new UnauthorizedException('admin not found');
    }

    admin.accountStatus = 'verified';
    return await this.adminRepo.save(admin);
  }

  async resetPassword(token: string, newPassword: string): Promise<string> {
    const adminId = await this.otpService.validateResetPassword(token);

    const admin = await this.adminRepo.findOne({ where: { id: adminId } });
    if (!admin) {
      throw new BadRequestException('admin not found');
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await this.adminRepo.save(admin);

    return 'Password reset successfully';
  }
}
