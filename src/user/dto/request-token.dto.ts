import { IsEmail, IsString } from 'class-validator';

export class RequestTokenDto {
  @IsEmail()
  @IsString()
  email: string;
}