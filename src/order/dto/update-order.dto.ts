import { ProductStatus } from 'src/utils/enum';
import { IsNotEmpty } from 'class-validator';

export class UpdateOrderDto {
  @IsNotEmpty()
  status: ProductStatus;
}
