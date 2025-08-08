import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserAuthService } from './auth.service';
import { UserService } from '../user.service';
import { UserLoginDto } from './dto/user-login.dto';
import { JwtAuthGuard } from '../../utils/guard/jwt-auth.guard';
import { ConfirmSigninDto } from 'src/saller/auth/dto/confirim-signin.dto';
import { ResetPasswordDto } from './dto/reset-password';

@Controller('auth/user')
export class UserAuthController {
  constructor(
    private authService: UserAuthService,
    private userService: UserService,
  ) {}

  @Post('login')
  async login(@Body() dto: UserLoginDto) {
    return this.authService.login(dto);
  }

  @Post('confirm-signin')
  async confirmSignin(@Body() dto: ConfirmSigninDto) {
    return this.authService.confirmSignin(dto.email, dto.otp);
  }

  @Post('reset-password')
  async resetPassword(@Query() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() request) {
    const user = await this.userService.findByEmail(request.user.email);
    if (!user) throw new NotFoundException('User not found');
    return {
      message: 'Welcome to your profile',
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
    };
  }
}
