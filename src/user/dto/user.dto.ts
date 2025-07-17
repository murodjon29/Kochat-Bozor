import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class UserDto {
  @IsString()
  fullName: string;

  @IsString()
  phone: string;

  @IsEmail()
  @IsString()
  email: string;

  @IsStrongPassword()
  @IsString()
  password: string;
}
