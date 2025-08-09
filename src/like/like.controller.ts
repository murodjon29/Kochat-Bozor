import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { LikeService } from './like.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { CheckRoles } from 'src/utils/decorators/roles.decorator';
import { Role } from 'src/utils/enum';
import { Request } from 'express';
import { MyRequest } from 'src/saller/saller.controller';

@Controller('like')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @CheckRoles(Role.USER)
  @Post()
  create(@Body() createLikeDto: CreateLikeDto, @Req() req: MyRequest) {
    const userId = req.user['id'];
    return this.likeService.create(userId, createLikeDto.productId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @CheckRoles(Role.USER)
  @Get()
  findAll(@Req() req: MyRequest) {
    const userId = req.user['id'];
    return this.likeService.findAll(userId);
  }
}
