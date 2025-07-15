import { Body, Controller, NotFoundException, Post } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminDto } from './dto/admin.dto';
import { RequestTokenDto } from './dto/requestToken.dto';
import { OTPType } from 'src/otp/type/otpType';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('register')
  async register(@Body() adminDto: AdminDto) {
    await this.adminService.register(adminDto);
    return { message: 'admin created successfully and OTP sent to email' };
  }

  @Post('request-otp')
  async requestOTP(@Body() dto: RequestTokenDto) {
    const { email } = dto;
    const admin = await this.adminService.findByEmail(email);
    if (!admin) {
      throw new NotFoundException('admin not found');
    }

    //send otp
    await this.adminService.emailVerification(admin, OTPType.OTP);
    return { message: 'OTP sent successfully.Please check email' };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotDto: RequestTokenDto) {
    const { email } = forgotDto;
    const admin = await this.adminService.findByEmail(email);
    if (!admin) {
      throw new NotFoundException('admin not found');
    }

    await this.adminService.emailVerification(admin, OTPType.RESET_LINK);
    return {
      message: 'Password reset link has been sent.Please check your mail.',
    };
  }
}
