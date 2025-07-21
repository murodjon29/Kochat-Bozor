import { BaseDatabase } from 'src/utils/database/base-database.ts';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ProductImage } from './image.entitiy';
import { Saller } from './saller.entity';

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

  @Column()
  height: number;

  @Column()
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
}
