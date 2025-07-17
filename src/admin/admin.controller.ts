import { Body, Controller, Post, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { RequestTokenDto } from '../user/dto/request-token.dto';
import { OTPType } from 'src/utils/otp/types/otp-type';
import { UserDto } from 'src/user/dto/user.dto';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('register')
  async register(@Body() adminDto: UserDto) {
    await this.adminService.register(adminDto);
    return { message: 'Admin created successfully and OTP sent to email' };
  }

  @Post('request-otp')
  async requestOTP(@Body() dto: RequestTokenDto) {
    const admin = await this.adminService.findByEmail(dto.email);
    if (!admin) throw new NotFoundException('Admin not found');
    await this.adminService.emailVerification(admin, OTPType.OTP);
    return { message: 'OTP sent successfully. Please check email' };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: RequestTokenDto) {
    const admin = await this.adminService.findByEmail(dto.email);
    if (!admin) throw new NotFoundException('Admin not found');
    await this.adminService.emailVerification(admin, OTPType.RESET_LINK);
    return { message: 'Password reset link has been sent. Please check your mail' };
  }
} 