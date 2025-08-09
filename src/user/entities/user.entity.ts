import { Like } from 'src/like/entities/like.entity';
import { Order } from 'src/order/entities/order.entity';
import { BaseDatabase } from 'src/utils/database/base-database.ts';
import { Role } from 'src/utils/enum';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('user')
export class User extends BaseDatabase {
  @Column()
  fullName: string;

  @Column()
  phone: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 'unverified' })
  accountStatus: 'verified' | 'unverified';

  @OneToMany(() => Order, (order) => order.user, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  orders: Order[];

  @OneToMany(() => Like, (like) => like.user, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  likes: Like[];

  @Column({ default: Role.USER })
  role: Role;
}
