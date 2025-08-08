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
  async confirmSignin(
    @Body() body: ConfirmSigninDto,
  ) {
    return this.authService.confirmSignin(body);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() { token, password }: { token: string; password: string },
  ) {
    return this.authService.resetPassword(token, password);
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
