import { User } from 'src/user/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Admin extends User {}
