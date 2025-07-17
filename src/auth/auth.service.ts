import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserLoginDto } from './dto/user-login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { OTPService } from 'src/utils/otp/otp.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
    private otpService: OTPService,
  ) {}

  async login(dto: UserLoginDto) {
    const { email, password, otp } = dto;
    const user = await this.userRepository.findOne({ where: { email: email.toLowerCase() } });
    if (!user) throw new UnauthorizedException('Email doesnt exist');
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');
    if (user.accountStatus === 'unverified') {
      if (!otp) return { message: 'Your account is not verified. Please provide your otp to verify' };
      await this.verifyToken(user.id, otp);
    }
    const payload = { id: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken, userId: user.id, email: user.email };
  }

  async verifyToken(userId: number, token: string) {
    await this.otpService.validateUserOTP(userId, token);
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    user.accountStatus = 'verified';
    await this.userRepository.save(user);
  }

  async resetPassword(token: string, newPassword: string): Promise<string> {
    const userId = await this.otpService.validateResetPassword(token);
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
    return 'Password reset successfully';
  }
}