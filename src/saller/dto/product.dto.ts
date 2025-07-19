import { IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsNumber()
  @Type(() => Number) // Converts string to number (e.g., "123" -> 123)
  price: number;

  @IsEnum(['no', 'yes'])
  deliveryService: 'no' | 'yes';

  @IsNumber()
  @Type(() => Number) // Converts string to number
  @Min(1, { message: 'Stock must be greater than 0' })
  stock: number;

  @IsNumber()
  @Type(() => Number) // Converts string to number
  height: number;

  @IsNumber()
  @Type(() => Number) // Converts string to number
  age: number;

  @IsNumber()
  @Type(() => Number)
  sallerId: number;
}