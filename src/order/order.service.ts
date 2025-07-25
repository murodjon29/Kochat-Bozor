import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { In, Repository } from 'typeorm';
import { Product } from 'src/saller/entities/product.entiti';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class OrderService {

  constructor(
    @InjectRepository(Order) private orderRepository: Repository<Order>,
    @InjectRepository(Product) private productRepository: Repository<Product>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    try {
      const { productId, quantity, userId } = createOrderDto;
      const product = await this.productRepository.findOne({ where: {id: productId} });
      const user = await this.userRepository.findOne({ where: {id: userId} });
      if(!user) throw new NotFoundException('User not found');
      if(!product) throw new NotFoundException('Product not found');
      if(product.stock < quantity) throw new BadRequestException(`Zaxirada yetarli mahsulot yo'q: ${product.name}. Mavjud: ${product.stock}, So'ralgan: ${quantity}`);
      product.stock -= quantity;
      const totalPrice = product.price * quantity;
      const order = this.orderRepository.create({ product, quantity, totalPrice, user: { id: userId } });
      await this.productRepository.save(product);
      return await this.orderRepository.save(order);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error creating order: ${error.message}`,)
    }
  }

  async findAll() {
    try {
      const orders = await this.orderRepository.find({
        relations: ['product', 'user'],
      });
      return orders;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error finding orders: ${error.message}`,
      )
    }
  }

  findOne(id: number) {
    try {
      const order = this.orderRepository.findOne({
        where: {id},
        relations: ['product', 'user'],
      })
      if(!order) throw new NotFoundException('Order not found');
      return order;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error finding order: ${error.message}`,
      )
    }
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
