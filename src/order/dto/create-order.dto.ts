import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateOrderDto {
    @IsNotEmpty()
    productId: number;

    @IsNotEmpty()
    @IsNumber()
    quantity: number;

    @IsNotEmpty()
    userId: number
}
