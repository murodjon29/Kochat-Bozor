import { Body, Controller, Get, NotFoundException, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { UserLoginDto } from './dto/user-login.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';

@Controller('auth/user')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('login')
  async login(@Body() dto: UserLoginDto) {
    return this.authService.login(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body() { token, password }: { token: string; password: string }) {
    return this.authService.resetPassword(token, password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() request) {
    const user = await this.userService.findByEmail(request.user.email);
    if (!user) throw new NotFoundException('User not found');
    return { message: 'Welcome to your profile', fullName: user.fullName };
  }
}