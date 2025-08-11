import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
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

      const product = await this.productRepository.findOne({
        where: { id: productId },
      });
      if (!product) throw new NotFoundException('Product not found');

      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      const totalPrice = product.price * quantity;

      const order = this.orderRepository.create({
        product,
        quantity,
        totalPrice,
        user: { id: userId },
      });

      return await this.orderRepository.save(order);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error creating order: ${error.message}`,
      );
    }
  }

  async findAll() {
    try {
      return await this.orderRepository.find({
        relations: ['product', 'user'],
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error finding orders: ${error.message}`,
      );
    }
  }

  async findOne(id: number) {
    try {
      const order = await this.orderRepository.findOne({
        where: { id },
        relations: ['product', 'user'],
      });
      if (!order) throw new NotFoundException(`Order not found id: ${id}`);
      return order;
    } catch (error) {
      throw new InternalServerErrorException(
        `Orderni topishda xato: ${error.message}`,
      );
    }
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    try {
      const order = await this.orderRepository.findOne({
        where: { id },
        relations: ['product', 'user'],
      });
      if (!order) throw new NotFoundException(`Order not found id: ${id}`);
      if (updateOrderDto.status) {
        if (updateOrderDto.status === 'completed') {
          if (order.product.stock < order.quantity) {
            throw new BadRequestException(
              `Zaxirada yetarli mahsulot yo'q: ${order.product.name}. Mavjud: ${order.product.stock}, So'ralgan: ${order.quantity}`,
            );
          }
          order.product.stock -= order.quantity;
          await this.productRepository.save(order.product);
        }
        order.status = updateOrderDto.status;
      }

      return await this.orderRepository.save(order);
    } catch (error) {
      throw new InternalServerErrorException(
        `Orderni yangilashda xato: ${error.message}`,
      );
    }
  }

  async remove(id: number) {
    try {
      const order = await this.orderRepository.findOne({ where: { id } });
      if (!order) throw new NotFoundException(`Order not found id: ${id}`);
      await this.orderRepository.delete(id);
      return { message: 'Order removed successfully' };
    } catch (error) {
      throw new InternalServerErrorException(
        `Orderni o'chirishda xato: ${error.message}`,
      );
    }
  }
}
