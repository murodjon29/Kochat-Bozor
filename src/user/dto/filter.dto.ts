import { IsNumber, IsString } from "class-validator"

export class FilterDto{
        @IsNumber()
        page: number
        
        @IsNumber()
        limit: number

        @IsString()
        name: string

        @IsString()
        search: string

        @IsNumber()
        minPrice: number

        @IsNumber()
        maxPrice: number

        @IsNumber()
        categoryId: number

        @IsString()
        region: string

        @IsString()
        deliveryService: string

        @IsNumber()
        minHeight: number

        @IsNumber()
        maxHeight: number

        @IsNumber()
        minAge: number

        @IsNumber()
        maxAge: number
}