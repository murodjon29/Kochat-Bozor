import { BaseDatabase } from 'src/utils/database/base-database.ts';
import { Column, Entity } from 'typeorm';

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
}