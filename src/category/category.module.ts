import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Category])], // CategoryRepository ni ta'minlaydi
  providers: [CategoryService],
  controllers: [CategoryController],
  exports: [TypeOrmModule], // CategoryRepository ni eksport qilish
})
export class CategoryModule {}