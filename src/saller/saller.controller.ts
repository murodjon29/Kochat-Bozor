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
import { SallerService } from './saller.service';
import { RequestTokenDto } from '../user/dto/request-token.dto';
import { UserDto } from 'src/user/dto/user.dto';
import { OTPType } from 'src/utils/otp/types/otp-type';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { Saller } from './entities/saller.entity';
import { SelfGuard } from 'src/utils/guard/self.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { CheckRoles } from 'src/utils/decorators/roles.decorator';
import { Role } from 'src/utils/enum';

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
    const normalizedEmail = dto.email.toLowerCase();
    const saller = await this.sallerService.findByEmail(normalizedEmail);
    await this.sallerService.emailVerification(saller, OTPType.OTP);
    return { message: 'OTP sent successfully. Please check email' };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: RequestTokenDto) {
    const normalizedEmail = dto.email.toLowerCase();
    const saller = await this.sallerService.findByEmail(normalizedEmail);
    await this.sallerService.emailVerification(saller, OTPType.RESET_LINK);
    return { message: 'Password reset link has been sent. Please check your mail' };
  }

  @UseGuards(JwtAuthGuard, SelfGuard)
  @Get(':id')
  async getProfile(@Param('id') id: number) {
    if (isNaN(id)) throw new BadRequestException('Invalid saller ID');
    return await this.sallerService.findById(id);
  }

  @UseGuards(JwtAuthGuard, SelfGuard)
  @Put(':id')
  async updateProfile(@Param('id') id: number, @Body() data: Partial<Saller>) {
    if (isNaN(id)) throw new BadRequestException('Invalid saller ID');
    return await this.sallerService.updateProfile(id, data);
  }

  @UseGuards(JwtAuthGuard, SelfGuard)
  @Delete(':id')
  async deleteAccount(@Param('id') id: number) {
    if (isNaN(id)) throw new BadRequestException('Invalid saller ID');
    return await this.sallerService.deleteAccount(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @CheckRoles(Role.ADMIN, Role.SUPERADMIN)
  @Get()
  async getAllSallers() {
    return await this.sallerService.findAllSallers();
  }
}