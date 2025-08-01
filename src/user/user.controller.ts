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
  Patch,
  Query,
  Req,
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
import { MyRequest } from 'src/saller/saller.controller';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard, SelfGuard)
  @Get('my-orders')
  async myOrder(@Req() req: MyRequest) {
    return await this.userService.myOrders(req.user.id);
  }

  @UseGuards(JwtAuthGuard, SelfGuard)
  @Get('my-favorites')
  async myFavotirites(@Req() req: MyRequest) {
    return await this.userService.myFavotirites(req.user.id);
  }

  @Post('register')
  async register(@Body() userDto: UserDto) {
    await this.userService.register(userDto);
    return { message: 'Foydalanuvchi muvaffaqiyatli ro‘yxatdan o‘tdi va OTP emailga yuborildi' };
  }

  @Post('request-otp')
  async requestOTP(@Body() dto: RequestTokenDto) {
    const normalizedEmail = dto.email.toLowerCase();
    const user = await this.userService.findByEmail(normalizedEmail);
    await this.userService.emailVerification(user, OTPType.OTP);
    return { message: 'OTP muvaffaqiyatli yuborildi. Emailingizni tekshiring' };
  }
  
  @Post('forgot-password')
  async forgotPassword(@Body() dto: RequestTokenDto) {
    const normalizedEmail = dto.email.toLowerCase();
    const user = await this.userService.findByEmail(normalizedEmail);
    await this.userService.emailVerification(user, OTPType.RESET_LINK);
    return {
      message: 'Parolni tiklash havolasi yuborildi. Emailingizni tekshiring',
    };
  }

  @Get('filter')
  async getAllProduct(@Query() query: any) {
    return await this.userService.getFilter(query);
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
    if (isNaN(id)) throw new BadRequestException('Noto‘g‘ri foydalanuvchi ID');
    return await this.userService.findById(id);
  }

  @UseGuards(JwtAuthGuard, SelfGuard)
  @Patch(':id')
  async updateProfile(@Param('id') id: number, @Body() data: Partial<User>) {
    if (isNaN(id)) throw new BadRequestException('Noto‘g‘ri foydalanuvchi ID');
    return await this.userService.updateProfile(id, data);
  }

  @UseGuards(JwtAuthGuard, SelfGuard)
  @Delete(':id')
  async deleteAccount(@Param('id') id: number) {
    if (isNaN(id)) throw new BadRequestException('Noto‘g‘ri foydalanuvchi ID');
    return await this.userService.deleteAccount(id);
  }
}