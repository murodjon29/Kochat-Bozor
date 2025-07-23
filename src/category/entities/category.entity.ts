import { Product } from 'src/saller/entities/product.entiti';
import { BaseDatabase } from 'src/utils/database/base-database.ts';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('category')
export class Category extends BaseDatabase {
  @Column()
  name: string;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
