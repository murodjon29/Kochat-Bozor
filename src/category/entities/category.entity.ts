import { BaseDatabase } from "src/utils/database/base-database.ts";
import { Column, Entity } from "typeorm";

@Entity('category')
export class Category extends BaseDatabase {
    
    @Column()
    name: string
    
}
