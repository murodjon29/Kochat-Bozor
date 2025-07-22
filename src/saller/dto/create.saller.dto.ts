import { IsNotEmpty, IsPhoneNumber, IsString, IsStrongPassword } from 'class-validator';

export class CreateSallerDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsPhoneNumber('UZ')
  phone: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsStrongPassword()
  password: string;

  @IsString()
  @IsNotEmpty()
  businessName: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  experience: string;
}