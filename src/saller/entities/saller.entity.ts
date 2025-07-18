import { BaseDatabase } from 'src/utils/database/base-database.ts';
import { Role } from 'src/utils/enum';
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

  @Column({ default: Role.SALLER })
  role: Role;
}
