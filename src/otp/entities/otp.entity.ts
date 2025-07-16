import { User } from 'src/user/entities/user.entity';
import { Admin } from 'src/admin/entities/admin.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OTPType } from '../type/otpType';

@Entity()
export class OTP {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Admin, { nullable: true })
  @JoinColumn()
  admin: Admin;

  @Column()
  token: string;

  @Column({ type: 'enum', enum: OTPType })
  type: OTPType;

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
