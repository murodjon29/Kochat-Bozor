import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      const category = this.categoryRepository.create(createCategoryDto);
      await this.categoryRepository.save(category);
      return category;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error creating category: ${error.message}`,
      );
    }
  }

  findAll() {
    try {
      const categories = this.categoryRepository.find({
        relations: ['products'],
      });
      return categories;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error finding categories: ${error.message}`,
      );
    }
  }

  findOne(id: number) {
    try {
      const category = this.categoryRepository.findOne({
        where: { id },
        relations: ['products'],
      });
      return category;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error finding category: ${error.message}`,
      );
    }
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    try {
      if (!(await this.categoryRepository.findOne({ where: { id } })))
        throw new InternalServerErrorException('Category not found');
      await this.categoryRepository.update(
        id,
        updateCategoryDto,
      );
      const category = await this.categoryRepository.findOne({ where: { id }, relations: ['products'] }); 
      return category;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error updating category: ${error.message}`,
      );
    }
  }

  async remove(id: number) {
    try {
      const category = await this.categoryRepository.findOne({ where: { id } });
      if (!category)
        throw new InternalServerErrorException('Category not found');
      await this.categoryRepository.remove(category);
      return { message: 'Category removed successfully' };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error removing category: ${error.message}`,
      );
    }
  }
}
