import { BaseDatabase } from 'src/utils/database/base-database.ts';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ProductImage } from './image.entitiy';
import { Saller } from './saller.entity';
import { Category } from 'src/category/entities/category.entity';
import { Like } from 'src/like/entities/like.entity';

@Entity('product')
export class Product extends BaseDatabase {
  @Column()
  name: string;

  @Column()
  price: number;

  @Column()
  deliveryService: 'no' | 'yes';

  @Column()
  stock: number;

  @Column({type: 'float'})
  height: number;

  @Column({type: 'float'})
  age: number;

  @Column()
  region: string;

  @OneToMany(() => ProductImage, (image) => image.product, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  images: ProductImage[];

  @ManyToOne(() => Saller, (saller) => saller.products, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'sallerId' })
  saller: Saller;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @OneToMany(() => Like, (like) => like.likes, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  likes: Like;
}
