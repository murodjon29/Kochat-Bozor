import { IsEmail, IsString, IsOptional } from 'class-validator';

export class SallerLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
