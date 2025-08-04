import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  UseGuards,
  Patch,
  Req,
} from '@nestjs/common';
import { SallerService } from './saller.service';
import { RequestTokenDto } from '../user/dto/request-token.dto';
import { OTPType } from 'src/utils/otp/types/otp-type';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { SelfGuard } from 'src/utils/guard/self.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { CheckRoles } from 'src/utils/decorators/roles.decorator';
import { Role } from 'src/utils/enum';
import { CreateProductDto } from './dto/product.dto';
import { UpdateDto } from './dto/updet.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/utils/decorators/public.decorator';
import { CreateSallerDto } from './dto/create.saller.dto';
import { UpdateSallerDto } from './dto/update-saller.dto';
import { Request } from 'express';

export interface MyRequest extends Request {
  user: any
}

@Controller('saller')
export class SallerController {
  constructor(private sallerService: SallerService) {}

  @Post('register')
  @Public()
  async register(@Body() sallerDto: CreateSallerDto) {
    await this.sallerService.register(sallerDto);
    return { message: 'Saller created successfully and OTP sent to email' };
  }

  @Public()
  @Get('products')
  async getProducts() {
    return await this.sallerService.getAllProducts();
  }

  @Post('request-otp')
  @Public()
  async requestOTP(@Body() dto: RequestTokenDto) {
    const normalizedEmail = dto.email.toLowerCase();
    const saller = await this.sallerService.findByEmail(normalizedEmail);
    await this.sallerService.emailVerification(saller, OTPType.OTP);
    return { message: 'OTP sent successfully. Please check email' };
  }

  @Post('forgot-password')
  @Public()
  async forgotPassword(@Body() dto: RequestTokenDto) {
    const normalizedEmail = dto.email.toLowerCase();
    const saller = await this.sallerService.findByEmail(normalizedEmail);
    await this.sallerService.emailVerification(saller, OTPType.RESET_LINK);
    return {
      message: 'Password reset link has been sent. Please check your mail',
    };
  }
  @UseGuards(JwtAuthGuard, SelfGuard)
  @Get('my-products')
  async getProduct(@Req() req: MyRequest ) {
    return await this.sallerService.myProducts(req.user.id);
  }

  @UseGuards(JwtAuthGuard, SelfGuard)
  @Get('my-orders')
  async getMyOreders(@Req() req: MyRequest) {
    return await this.sallerService.myOrders(req.user.id);
  }

  @UseInterceptors(FilesInterceptor('images'))
  @UseGuards(JwtAuthGuard, SelfGuard)
  @Post('post-product')
  async createProduct(
    @Body() dto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0)
      throw new BadRequestException('No files uploaded');
    return await this.sallerService.createProduct(dto, files);
  }


  @UseGuards(JwtAuthGuard, SelfGuard)
  @Get()
  async getAllSallers() {
    return await this.sallerService.findAllSallers();
  }

  @UseGuards(JwtAuthGuard, SelfGuard)
  @Get(':id')
  async getProfile(@Param('id') id: number) {
    if (isNaN(id)) throw new BadRequestException('Invalid saller ID');
    return await this.sallerService.findById(id);
  }

  @UseGuards(JwtAuthGuard, SelfGuard)
  @Patch(':id')
  async updateProfile(@Param('id') id: number, @Body() data: UpdateSallerDto) {
    if (isNaN(id)) throw new BadRequestException('Invalid saller ID');
    return await this.sallerService.updateProfile(id, data);
  }

  @UseGuards(JwtAuthGuard, SelfGuard)
  @Delete(':id')
  async deleteAccount(@Param('id') id: number) {
    if (isNaN(id)) throw new BadRequestException('Invalid saller ID');
    return await this.sallerService.deleteAccount(id);
  }


  @UseInterceptors(FilesInterceptor('images'))
  @Patch('product/:id')
  @UseGuards(JwtAuthGuard)
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (isNaN(+id)) throw new BadRequestException('Invalid product ID');
    return await this.sallerService.updateProduct(+id, dto, files);
  }

  @UseGuards(JwtAuthGuard, SelfGuard)
  @Delete('product/:id')
  async deleteProduct(@Param('id') id: string) {
    if (isNaN(+id)) throw new BadRequestException('Invalid product ID');
    return await this.sallerService.deleteProduct(+id);
  }
}
