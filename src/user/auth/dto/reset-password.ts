import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsStrongPassword()
  newPassword: string;

  @IsString()
  otp: string;
}
