import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { SallerLoginDto } from './dto/saller-login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { SallerService } from '../saller.service';
import { Saller } from '../entities/saller.entity';
import { OTPService } from 'src/utils/otp/otp.service';

@Injectable()
export class SallerAuthService {
  constructor(
    @InjectRepository(Saller) private sallerRepository: Repository<Saller>,
    private jwtService: JwtService,
    private otpService: OTPService,
    private sallerService: SallerService,
  ) {}

  async login(dto: SallerLoginDto) {
    const { email, password, otp } = dto;
    const saller = await this.sallerRepository.findOne({ where: { email: email.toLowerCase() } });
    if (!saller) throw new UnauthorizedException('Email doesnt exist');
    const passwordMatch = await bcrypt.compare(password, saller.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');
    if (saller.accountStatus === 'unverified') {
      if (!otp) return { message: 'Your account is not verified. Please provide your otp to verify' };
      await this.verifyToken(saller.id, otp);
    }
    const payload = { id: saller.id, email: saller.email };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken, sallerId: saller.id, email: saller.email };
  }

  async verifyToken(sallerId: number, token: string) {
    await this.otpService.validateSallerOTP(sallerId, token);
    const saller = await this.sallerRepository.findOne({ where: { id: sallerId } });
    if (!saller) throw new UnauthorizedException('Saller not found');
    saller.accountStatus = 'verified';
    await this.sallerRepository.save(saller);
  }

  async resetPassword(token: string, newPassword: string): Promise<string> {
    const sallerId = await this.otpService.validateResetPassword(token);
    const saller = await this.sallerRepository.findOne({ where: { id: sallerId } });
    if (!saller) throw new BadRequestException('Saller not found');
    saller.password = await bcrypt.hash(newPassword, 10);
    await this.sallerRepository.save(saller);
    return 'Password reset successfully';
  }
}