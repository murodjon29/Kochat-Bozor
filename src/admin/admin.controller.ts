import {
  Body,
  Controller,
  Post,
  NotFoundException,
  Get,
  Put,
  Delete,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { RequestTokenDto } from '../user/dto/request-token.dto';
import { OTPType } from 'src/utils/otp/types/otp-type';
import { UserDto } from 'src/user/dto/user.dto';
import { Admin } from './entities/admin.entity';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { SelfGuard } from 'src/utils/guard/self.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { CheckRoles } from 'src/utils/decorators/roles.decorator';
import { Role } from 'src/utils/enum';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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

  @UseGuards(JwtAuthGuard, SelfGuard)
  @Get(':id')
  async getAdmin(@Param('id') id: string) {
    const adminId = parseInt(id, 10);
    if (isNaN(adminId)) throw new BadRequestException('Invalid admin ID');
    return await this.adminService.findById(adminId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @CheckRoles(Role.SUPERADMIN)
  @Get('get-admins')
  async getAdmins(@Request() req) {
    const adminId = req.user?.id;
    if (!adminId || isNaN(Number(adminId))) throw new BadRequestException('Admin not authenticated or invalid ID');
    return await this.adminService.getAdmins();
  }

  @UseGuards(JwtAuthGuard, SelfGuard)
  @Put(':id')
  async updateAdmin(@Param('id') id: string, @Body() data: Partial<Admin>) {
    const adminId = parseInt(id, 10);
    if (isNaN(adminId)) throw new BadRequestException('Invalid admin ID');
    return await this.adminService.updateProfile(adminId, data);
  }

  @UseGuards(JwtAuthGuard, SelfGuard)
  @Delete(':id')
  async deleteAdmin(@Param('id') id: string) {
    const adminId = parseInt(id, 10);
    if (isNaN(adminId)) throw new BadRequestException('Invalid admin ID');
    return await this.adminService.deleteAccount(adminId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @CheckRoles(Role.ADMIN)
  @Post('create-user')
  async createUser(@Body() dto: UserDto) {
    return await this.adminService.createUser(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @CheckRoles(Role.ADMIN)
  @Post('create-saller')
  async createSaller(@Body() dto: UserDto) {
    return await this.adminService.createSaller(dto);
  }
}