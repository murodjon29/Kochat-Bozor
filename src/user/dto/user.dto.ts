import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class UserDto {
  @IsString()
  fullName: string;

  @IsString()
  phone: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsStrongPassword()
  password: string;
}
