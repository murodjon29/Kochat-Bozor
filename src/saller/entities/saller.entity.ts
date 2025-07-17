import { BaseDatabase } from 'src/utils/database/base-database.ts';
import { Column, Entity } from 'typeorm';

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
}
