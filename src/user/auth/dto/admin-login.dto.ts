import { IsEmail, IsString, IsOptional } from 'class-validator';

export class AdminloginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  otp?: string;
}
