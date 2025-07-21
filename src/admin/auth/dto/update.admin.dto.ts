import { IsEmail, IsNotEmpty, IsStrongPassword } from 'class-validator';

export class updateAdminDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsStrongPassword()
  password: string;
}
