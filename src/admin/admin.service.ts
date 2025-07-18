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
      const { email, password, phone } = dto;
      const normalizedEmail = email.toLowerCase();
      const existingAdmin = await this.adminRepository.findOne({
        where: { email: normalizedEmail },
      });
      if (existingAdmin) throw new BadRequestException('Email already exists');
      const existingPhoneAdmin = await this.adminRepository.findOne({
        where: { phone },
      });
      if (existingPhoneAdmin) throw new BadRequestException('Phone already exists');
      const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt());
      const newAdmin = this.adminRepository.create({
        ...dto,
        email: normalizedEmail,
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
    try {
      const normalizedEmail = email.toLowerCase();
      console.log(`Searching for admin with email: ${normalizedEmail}`);
      const admin = await this.adminRepository.findOne({
        where: { email: normalizedEmail },
      });
      if (!admin) throw new NotFoundException(`Admin not found with email: ${email}`);
      return admin;
    } catch (error) {
      throw new InternalServerErrorException(`Error finding admin: ${error.message}`);
    }
  }

  async findById(id: number): Promise<Admin> {
    try {
      if (isNaN(id)) throw new BadRequestException('Invalid admin ID');
      const admin = await this.adminRepository.findOne({ where: { id } });
      if (!admin) throw new NotFoundException(`Admin not found: ${id}`);
      return admin;
    } catch (error) {
      throw new InternalServerErrorException(`Error finding admin: ${error.message}`);
    }
  }

  async updateProfile(id: number, data: Partial<Admin>): Promise<Admin> {
    try {
      if (isNaN(id)) throw new BadRequestException('Invalid admin ID');
      const admin = await this.findById(id);
      if (data.email && data.email.toLowerCase() !== admin.email) {
        const emailExists = await this.adminRepository.findOne({
          where: { email: data.email.toLowerCase() },
        });
        if (emailExists) throw new BadRequestException('Email already exists');
      }
      if (data.phone && data.phone !== admin.phone) {
        const phoneExists = await this.adminRepository.findOne({
          where: { phone: data.phone },
        });
        if (phoneExists) throw new BadRequestException('Phone already exists');
      }
      if (data.password) {
        data.password = await bcrypt.hash(data.password, await bcrypt.genSalt());
      }
      await this.adminRepository.update(id, data);
      return await this.findById(id);
    } catch (error) {
      throw new InternalServerErrorException(`Error updating admin: ${error.message}`);
    }
  }

  async deleteAccount(id: number): Promise<{ message: string }> {
    try {
      if (isNaN(id)) throw new BadRequestException('Invalid admin ID');
      const admin = await this.findById(id);
      await this.adminRepository.remove(admin);
      return { message: 'Admin deleted successfully' };
    } catch (error) {
      throw new InternalServerErrorException(`Error deleting admin: ${error.message}`);
    }
  }

  async createUser(dto: UserDto): Promise<{ message: string }> {
    try {
      await this.userService.register(dto);
      const user = await this.userService.findByEmail(dto.email.toLowerCase());
      await this.userService.emailVerification(user, OTPType.OTP);
      return { message: 'User created successfully and OTP sent to email' };
    } catch (error) {
      throw new InternalServerErrorException(`Error creating user: ${error.message}`);
    }
  }

  async createSaller(dto: UserDto): Promise<{ message: string }> {
    try {
      await this.sallerService.register(dto);
      const saller = await this.sallerService.findByEmail(dto.email.toLowerCase());
      await this.sallerService.emailVerification(saller, OTPType.OTP);
      return { message: 'Saller created successfully and OTP sent to email' };
    } catch (error) {
      throw new InternalServerErrorException(`Error creating saller: ${error.message}`);
    }
  }

  async getAdmins(): Promise<Admin[]> {
    try {
      const admins = await this.adminRepository.find();
      if (!admins.length) throw new NotFoundException('No admins found');
      return admins;
    } catch (error) {
      throw new InternalServerErrorException(`Error finding admins: ${error.message}`);
    }
  }
}