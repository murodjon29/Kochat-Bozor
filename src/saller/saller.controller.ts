import { Body, Controller, Post, NotFoundException } from '@nestjs/common';
import { SallerService } from './saller.service';
import { RequestTokenDto } from '../user/dto/request-token.dto';
import { UserDto } from 'src/user/dto/user.dto';
import { OTPType } from 'src/utils/otp/types/otp-type';

@Controller('saller')
export class SallerController {
  constructor(private sallerService: SallerService) {}

  @Post('register')
  async register(@Body() sallerDto: UserDto) {
    await this.sallerService.register(sallerDto);
    return { message: 'Saller created successfully and OTP sent to email' };
  }

  @Post('request-otp')
  async requestOTP(@Body() dto: RequestTokenDto) {
    const saller = await this.sallerService.findByEmail(dto.email);
    if (!saller) throw new NotFoundException('Saller not found');
    await this.sallerService.emailVerification(saller, OTPType.OTP);
    return { message: 'OTP sent successfully. Please check email' };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: RequestTokenDto) {
    const saller = await this.sallerService.findByEmail(dto.email);
    if (!saller) throw new NotFoundException('Saller not found');
    await this.sallerService.emailVerification(saller, OTPType.RESET_LINK);
    return { message: 'Password reset link has been sent. Please check your mail' };
  }
}