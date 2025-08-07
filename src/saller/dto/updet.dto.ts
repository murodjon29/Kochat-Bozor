import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './product.dto';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsEnum(['no', 'yes'])
  deliveryService?: 'no' | 'yes';

  @IsNumber()
  @Type(() => Number)
  @Min(1, { message: 'Stock must be greater than 0' })
  @IsOptional()
  stock?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  height?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  age?: number;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoryId?: number;
}
