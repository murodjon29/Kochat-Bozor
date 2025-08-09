import { Product } from 'src/saller/entities/product.entiti';
import { User } from 'src/user/entities/user.entity';
import { BaseDatabase } from 'src/utils/database/base-database.ts';
import { ProductStatus } from 'src/utils/enum';
import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';

@Entity('order')
export class Order extends BaseDatabase {
  @ManyToOne(() => User, (user) => user.orders, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Product, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ default: ProductStatus.PANDING })
  status: ProductStatus;
}
