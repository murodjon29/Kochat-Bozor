import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminLoginDto } from './dto/admin-login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { AdminService } from '../admin.service';
import { OTPService } from 'src/utils/otp/otp.service';
import { Admin } from '../entities/admin.entity';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(Admin) private adminRepository: Repository<Admin>,
    private jwtService: JwtService,
    private otpService: OTPService,
    private adminService: AdminService,
  ) {}

  async login(dto: AdminLoginDto) {
    const { email, password, otp } = dto;
    console.log(otp);

    const admin = await this.adminRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!admin) throw new UnauthorizedException('Email doesnt exist');
    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');
    if (admin.accountStatus === 'unverified') {
      if (!otp)
        return {
          message:
            'Your account is not verified. Please provide your otp to verify',
        };
      await this.verifyToken(admin.id, otp);
    }
    const payload = { id: admin.id, email: admin.email };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken, adminId: admin.id, email: admin.email };
  }

  async verifyToken(adminId: number, token: string) {
    await this.otpService.validateAdminOTP(adminId, token);
    const admin = await this.adminRepository.findOne({
      where: { id: adminId },
    });
    if (!admin) throw new UnauthorizedException('Admin not found');
    admin.accountStatus = 'verified';
    await this.adminRepository.save(admin);
  }

  async resetPassword(token: string, newPassword: string): Promise<string> {
    const adminId = await this.otpService.validateResetPassword(token);
    const admin = await this.adminRepository.findOne({
      where: { id: adminId },
    });
    if (!admin) throw new BadRequestException('Admin not found');
    admin.password = await bcrypt.hash(newPassword, 10);
    await this.adminRepository.save(admin);
    return 'Password reset successfully';
  }
}
