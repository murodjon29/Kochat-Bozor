import { IsEmail, IsString } from 'class-validator';

export class ConfirmSigninDto {
  @IsString()
  otp: string;

  @IsEmail()
  email: string;
}
