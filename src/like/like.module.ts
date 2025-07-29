import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { Product } from 'src/saller/entities/product.entiti';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Like, User, Product ])],
  controllers: [LikeController],
  providers: [LikeService],
})
export class LikeModule {}
