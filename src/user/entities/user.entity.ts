import { Like } from 'src/like/entities/like.entity';
import { Order } from 'src/order/entities/order.entity';
import { BaseDatabase } from 'src/utils/database/base-database.ts';
import { Role } from 'src/utils/enum';
import { Column, Entity, OneToMany, OneToOne } from 'typeorm';

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

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToOne(() => Like, (like) => like.likes)
  likes: Like;

  @Column({ default: Role.USER })
  role: Role;
}
