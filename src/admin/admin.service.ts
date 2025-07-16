import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminDto } from './dto/admin.dto';
import * as bcrypt from 'bcryptjs';
import { OTPService } from 'src/otp/otp.service';
import { OTPType } from 'src/otp/type/otpType';
import { EmailService } from 'src/email/email.service';
import { ConfigService } from '@nestjs/config';
import { Admin } from './entities/admin.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly otpService: OTPService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: AdminDto): Promise<void> {
    const { email, password } = dto;
    email.toLowerCase();
    const existingUser = await this.adminRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException({ message: 'Email already exists' });
    }

    const existingPhone = await this.adminRepository.findOne({
      where: { phone: dto.phone },
    });

    if (existingPhone) {
      throw new BadRequestException({ message: 'Phone already exists' });
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = this.adminRepository.create({
      ...dto,
      email,
      password: hashedPassword,
    });

    await this.adminRepository.save(newUser);
    return this.emailVerification(newUser, OTPType.OTP);
  }

  async emailVerification(admin: Admin, otpType: OTPType) {
    const token = await this.otpService.generateToken(admin, otpType);

    if (otpType === OTPType.OTP) {
      const emailDto = {
        recipients: [admin.email],
        subject: 'OTP for verification',
        html: `Your otp code is: <strong>${token}</strong>.
      <br />Provide this otp to verify your account`,
      };

      return await this.emailService.sendEmail(emailDto);
    } else if (otpType === OTPType.RESET_LINK) {
      const resetLink = `${this.configService.get('RESET_PASSWORD_URL')}?token=${token}`;
      const emailDto = {
        recipients: [admin.email],
        subject: 'Password Reset Link',
        html: `Click the given link to reset your password: 
        <p><a href="${resetLink}">Reset Password</a></p>`,
      };

      return await this.emailService.sendEmail(emailDto);
    }
  }

  async findByEmail(email: string): Promise<Admin> {
    return await this.adminRepository.findOne({ where: { email } });
  }
}
