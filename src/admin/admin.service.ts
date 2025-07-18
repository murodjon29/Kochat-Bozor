import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { OTPService } from 'src/utils/otp/otp.service';
import { EmailService } from 'src/email/email.service';
import { Admin } from './entities/admin.entity';
import { OTPType } from 'src/utils/otp/types/otp-type';
import { UserDto } from 'src/user/dto/user.dto';
import { UserService } from 'src/user/user.service';
import { SallerService } from 'src/saller/saller.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin) private adminRepository: Repository<Admin>,
    private readonly userService: UserService,
    private readonly sallerService: SallerService,
    private readonly otpService: OTPService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: UserDto): Promise<void> {
    try {
      const { email, password } = dto;
      const existingAdmin = await this.adminRepository.findOne({
        where: { email: email.toLowerCase() },
      });
      if (existingAdmin) throw new BadRequestException('Email already exists');
      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = this.adminRepository.create({
        ...dto,
        email: email.toLowerCase(),
        password: hashedPassword,
      });
      await this.adminRepository.save(newAdmin);
      await this.emailVerification(newAdmin, OTPType.OTP);
    } catch (error) {
      throw new InternalServerErrorException(`Error creating admin: ${error.message}`);
    }
  }

  async emailVerification(admin: Admin, otpType: OTPType): Promise<void> {
    try {
      const token = await this.otpService.generateTokenForAdmin(admin.id, otpType);
      if (otpType === OTPType.OTP) {
        await this.emailService.sendEmail({
          recipients: [admin.email],
          subject: 'OTP for Verification',
          html: `Your OTP code is: <strong>${token}</strong>. Provide this OTP to verify your account.`,
        });
      } else if (otpType === OTPType.RESET_LINK) {
        const resetLink = `${this.configService.get('RESET_PASSWORD_URL')}?token=${token}`;
        await this.emailService.sendEmail({
          recipients: [admin.email],
          subject: 'Password Reset Link',
          html: `Click the link to reset your password: <a href="${resetLink}">Reset Password</a>`,
        });
      }
    } catch (error) {
      throw new InternalServerErrorException(`Error sending verification email: ${error.message}`);
    }
  }

  async findByEmail(email: string): Promise<Admin> {
    const admin = await this.adminRepository.findOne({ where: { email: email.toLowerCase() } });
    if (!admin) throw new NotFoundException(`Admin not found: ${email}`);
    return admin;
  }

  async findById(id: number): Promise<Admin> {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) throw new NotFoundException(`Admin not found: ${id}`);
    return admin;
  }

  async updateProfile(id: number, data: Partial<Admin>): Promise<Admin> {
    const admin = await this.findById(id);
    if (data.email && data.email.toLowerCase() !== admin.email) {
      const emailExists = await this.adminRepository.findOne({ where: { email: data.email.toLowerCase() } });
      if (emailExists) throw new BadRequestException('Email already exists');
    }
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    await this.adminRepository.update(id, data);
    return this.findById(id);
  }

  async deleteAccount(id: number): Promise<{ message: string }> {
    const admin = await this.findById(id);
    await this.adminRepository.remove(admin);
    return { message: 'Admin deleted successfully' };
  }

  async createUser(dto: UserDto): Promise<{ message: string }> {
    await this.userService.register(dto);
    const user = await this.userService.findByEmail(dto.email);
    await this.userService.emailVerification(user, OTPType.OTP);
    return { message: 'User created successfully and OTP sent to email' };
  }

  async createSaller(dto: UserDto): Promise<{ message: string }> {
    await this.sallerService.register(dto);
    const saller = await this.sallerService.findByEmail(dto.email);
    await this.sallerService.emailVerification(saller, OTPType.OTP);
    return { message: 'Saller created successfully and OTP sent to email' };
  }

  async getAdmins(): Promise<Admin[]> {
    const admins = await this.adminRepository.find();
    if (!admins.length) throw new NotFoundException('No admins found');
    return admins;
  }
}