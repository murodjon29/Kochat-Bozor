import {
  Body,
  Controller,
  Post,
  NotFoundException,
  Get,
  Put,
  Delete,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { RequestTokenDto } from '../user/dto/request-token.dto';
import { OTPType } from 'src/utils/otp/types/otp-type';
import { UserDto } from 'src/user/dto/user.dto';
import { Admin } from './entities/admin.entity';

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
    return {
      message: 'Password reset link has been sent. Please check your mail',
    };
  }

  @Get(':id')
  async getAdmin(@Body() id: number) {
    return await this.adminService.findById(id);
  }

  @Put(':id')
  async updateAdmin(@Body() id: number, @Body() data: Partial<Admin>) {
    return await this.adminService.updateProfile(id, data);
  }

  @Delete(':id')
  async deleteAdmin(@Body() id: number) {
    return await this.adminService.deleteAccount(id);
  }

  @Post('create-user')
  async createUser(@Body() dto: UserDto) {
    await this.adminService.createUser(dto);
    return { message: 'User created successfully and OTP sent to email' };
  }

  @Post('create-saller')
  async createSaller(@Body() dto: UserDto) {
    await this.adminService.createSaller(dto);
    return { message: 'Saller created successfully and OTP sent to email' };
  }

  @Get('users')
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('sallers')
  async getAllSallers() {
    return this.adminService.getAllSallers();
  }
}
