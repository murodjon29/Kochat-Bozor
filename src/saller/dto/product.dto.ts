import { IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsEnum(['no', 'yes'])
  deliveryService: 'no' | 'yes';

  @IsNumber()
  @Type(() => Number)
  @Min(1, { message: 'Stock must be greater than 0' })
  stock: number;

  @IsNumber()
  @Type(() => Number)
  height: number;

  @IsNumber()
  @Type(() => Number)
  age: number;

  @IsNumber()
  @Type(() => Number)
  sallerId: number;

  @IsString()
  region: string;
}
