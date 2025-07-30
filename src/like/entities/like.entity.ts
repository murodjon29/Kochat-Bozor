import { Product } from "src/saller/entities/product.entiti";
import { User } from "src/user/entities/user.entity";
import { BaseDatabase } from "src/utils/database/base-database.ts";
import { Entity, JoinColumn,  ManyToOne, } from "typeorm";

@Entity('like')
export class Like extends BaseDatabase {
    [x: string]: any;
    
    @ManyToOne(() => User, user => user.likes)
    @JoinColumn({ name: 'userId' })
    user: User


    @ManyToOne(() => Product, product => product.likes)
    @JoinColumn({ name: 'productId' })
    product: Product
}

