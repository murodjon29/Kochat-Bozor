import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthService } from './auth.service';
import { AdminService } from '../admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';

@Controller('auth/admin')
export class AdminAuthController {
  constructor(
    private authService: AdminAuthService,
    private adminService: AdminService,
  ) {}

  @Post('login')
  async login(@Body() dto: AdminLoginDto) {
    return this.authService.login(dto);
  }

  // @Post('reset-password')
  // async resetPassword(
  //   @Body() { token, password }: { token: string; password: string },
  // ) {
  //   return this.authService.resetPassword(token, password);
  // }

  // @UseGuards(JwtAuthGuard)
  // @Get('profile')
  // async getProfile(@Req() request) {
  //   const admin = await this.adminService.findByEmail(request.user.email);
  //   if (!admin) throw new NotFoundException('Admin not found');
  //   return {
  //     message: 'Welcome to your profile',
  //     fullName: admin.fullName,
  //     email: admin.email,
  //     phone: admin.phone,
  //     role: admin.role,
  //   };
  // }
}
