import { Product } from "src/saller/entities/product.entiti";
import { User } from "src/user/entities/user.entity";
import { BaseDatabase } from "src/utils/database/base-database.ts";
import { Entity, JoinColumn, OneToOne } from "typeorm";

@Entity('like')
export class Like extends BaseDatabase {
    [x: string]: any;
    
    @OneToOne(() => User,)
    @JoinColumn({ name: 'userId' })
    userId: number


    @OneToOne(() => Product,)
    @JoinColumn({ name: 'productId' })
    productId: number
}

