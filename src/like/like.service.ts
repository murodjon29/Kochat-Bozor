import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { User } from 'src/user/entities/user.entity';
import { Product } from 'src/saller/entities/product.entiti';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(userId: number, productId: number) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      const product = await this.productRepository.findOne({
        where: { id: productId },
      });

      if (!user || !product) {
        throw new NotFoundException('User yoki mahsulot topilmadi');
      }

      // Oldingi like mavjudmi?
      const existingLike = await this.likeRepository.findOne({
        where: {
          user: { id: userId },
          product: { id: productId },
        },
        relations: ['user', 'product'],
      });

      if (!existingLike) {
        const newLike = this.likeRepository.create({
          user,
          product,
        });
        await this.likeRepository.save(newLike);
        return {
          message: 'Mahsulotga like bosildi',
          liked: true,
        };
      }

      // Oldingi like bor bo‘lsa — o‘chirish (dislike)
      await this.likeRepository.delete(existingLike.id);
      return {
        message: 'Mahsulotdan like olib tashlandi (dislike)',
        liked: false,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Like/dislike bajarishda xatolik: ${error.message}`,
      );
    }
  }

  async findAll(userId: number) {
    try {
      const likes = await this.likeRepository.find({
        where: {
          user: { id: userId },
        },
        relations: ['product', 'product.images', 'user'],
      });

      return {
        message: 'Foydalanuvchining like qilingan mahsulotlari',
        total: likes.length,
        likes,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Likeni olishda xatolik: ${error.message}`,
      );
    }
  }
}
