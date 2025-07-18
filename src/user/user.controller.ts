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
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto } from './dto/user.dto';
import { RequestTokenDto } from './dto/request-token.dto';
import { OTPType } from 'src/utils/otp/types/otp-type';
import { JwtAuthGuard } from '../utils/guard/jwt-auth.guard';
import { User } from './entities/user.entity';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { CheckRoles } from 'src/utils/decorators/roles.decorator';
import { SelfGuard } from 'src/utils/guard/self.guard';
import { Role } from 'src/utils/enum';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('register')
  async register(@Body() userDto: UserDto) {
    await this.userService.register(userDto);
    return { message: 'User created successfully and OTP sent to email' };
  }

  @Post('request-otp')
  async requestOTP(@Body() dto: RequestTokenDto) {
    const normalizedEmail = dto.email.toLowerCase();
    const user = await this.userService.findByEmail(normalizedEmail);
    await this.userService.emailVerification(user, OTPType.OTP);
    return { message: 'OTP sent successfully. Please check email' };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: RequestTokenDto) {
    const normalizedEmail = dto.email.toLowerCase();
    const user = await this.userService.findByEmail(normalizedEmail);
    await this.userService.emailVerification(user, OTPType.RESET_LINK);
    return { message: 'Password reset link has been sent. Please check your mail' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @CheckRoles(Role.ADMIN, Role.SUPERADMIN)
  @Get()
  async getAllUsers() {
    return await this.userService.findAllUser();
  }

  @UseGuards(JwtAuthGuard, SelfGuard)
  @Get(':id')
  async getProfile(@Param('id') id: number) {
    if (isNaN(id)) throw new BadRequestException('Invalid user ID');
    return await this.userService.findById(id);
  }

  @UseGuards(JwtAuthGuard, SelfGuard)
  @Put(':id')
  async updateProfile(@Param('id') id: number, @Body() data: Partial<User>) {
    if (isNaN(id)) throw new BadRequestException('Invalid user ID');
    return await this.userService.updateProfile(id, data);
  }

  @UseGuards(JwtAuthGuard, SelfGuard)
  @Delete(':id')
  async deleteAccount(@Param('id') id: number) {
    if (isNaN(id)) throw new BadRequestException('Invalid user ID');
    return await this.userService.deleteAccount(id);
  }
}