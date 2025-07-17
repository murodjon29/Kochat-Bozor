import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { OTPService } from 'src/utils/otp/otp.service';
import { EmailService } from 'src/email/email.service';
import { Admin } from './entities/admin.entity';
import { OTPType } from 'src/utils/otp/types/otp-type';
import { UserDto } from 'src/user/dto/user.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin) private adminRepository: Repository<Admin>,
    private otpService: OTPService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async register(dto: UserDto): Promise<void> {
    const { email, password } = dto;
    email.toLowerCase()
    const existingAdmin = await this.adminRepository.findOne({ where: { email: email } });
    if (existingAdmin) throw new BadRequestException('Email already exists');
    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt());
    const newAdmin = this.adminRepository.create({ ...dto, email: email, password: hashedPassword });
    await this.adminRepository.save(newAdmin);
    await this.emailVerification(newAdmin, OTPType.OTP);
  }

  async emailVerification(admin: Admin, otpType: OTPType) {
    const token = await this.otpService.generateTokenForAdmin(admin.id, otpType);
    if (otpType === OTPType.OTP) {
      await this.emailService.sendEmail({
        recipients: [admin.email],
        subject: 'OTP for verification',
        html: `Your otp code is: <strong>${token}</strong>. Provide this otp to verify your account`,
      });
    } else if (otpType === OTPType.RESET_LINK) {
      const resetLink = `${this.configService.get('RESET_PASSWORD_URL')}?token=${token}`;
      await this.emailService.sendEmail({
        recipients: [admin.email],
        subject: 'Password Reset Link',
        html: `Click the given link to reset your password: <p><a href="${resetLink}">Reset Password</a></p>`,
      });
    }
  }

  async findByEmail(email: string): Promise<Admin> {
    return await this.adminRepository.findOne({ where: { email: email.toLowerCase() } });
  }
}