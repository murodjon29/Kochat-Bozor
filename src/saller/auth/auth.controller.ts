import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SallerAuthService } from './auth.service';
import { SallerService } from '../saller.service';
import { SallerLoginDto } from './dto/saller-login.dto';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { SelfGuard } from 'src/utils/guard/self.guard';
import { ConfirmSigninDto } from './dto/confirim-signin.dto';

@Controller('auth/saller')
export class SallerAuthController {
  constructor(
    private authService: SallerAuthService,
    private sallerService: SallerService,
  ) {}

  @Post('login')
  async login(@Body() dto: SallerLoginDto) {
    return this.authService.login(dto);
  }

  @Post('confirm-signin')
  async confirmSignin(@Body() body: ConfirmSigninDto) {
    return this.authService.confirmSignin(body);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: { email: string; otp: string; password: string },
  ) {
    return this.authService.resetPassword(body.email, body.otp, body.password);
  }

  @UseGuards(JwtAuthGuard, SelfGuard)
  @Get('profile')
  async getProfile(@Req() request) {
    const saller = await this.sallerService.findByEmail(request.user.email);
    if (!saller) throw new NotFoundException('Saller not found');
    return {
      message: 'Welcome to your profile',
      fullName: saller.fullName,
      email: saller.email,
      phone: saller.phone,
    };
  }
}
