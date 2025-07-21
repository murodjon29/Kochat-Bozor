import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Product } from './product.entiti';
import { BaseDatabase } from 'src/utils/database/base-database.ts';

@Entity('product_image')
export class ProductImage extends BaseDatabase {
  @ManyToOne(() => Product, (product) => product.images)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  ImageUrl: string;
}
