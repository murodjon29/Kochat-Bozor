import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Role } from 'src/utils/enum';
import { CheckRoles } from 'src/utils/decorators/roles.decorator';
import { SelfGuard } from 'src/utils/guard/self.guard';

@Controller('user/order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @CheckRoles(Role.USER)
  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @CheckRoles(Role.ADMIN)

  @Get()
  findAll() {

    return this.orderService.findAll();
  }

  @UseGuards(JwtAuthGuard, SelfGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @CheckRoles(Role.SALLER, Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(+id, updateOrderDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @CheckRoles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(+id);
  }
}
