import { BaseDatabase } from 'src/utils/database/base-database.ts';
import { Role } from 'src/utils/enum';
import { Column, Entity, OneToMany } from 'typeorm';
import { Product } from './product.entiti';

@Entity('saller')
export class Saller extends BaseDatabase {
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

  @Column({ default: Role.SALLER })
  role: Role;

  @OneToMany(() => Product, (product) => product.saller)
  products: Product[];
}