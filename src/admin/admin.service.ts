import {
  BadRequestException,
  Injectable,
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
import { User } from 'src/user/entities/user.entity';
import { Saller } from 'src/saller/entities/saller.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin) private adminRepository: Repository<Admin>,
    @InjectRepository(Saller) private sallerRepository: Repository<Saller>,
    @InjectRepository(User) private userRepository: Repository<User>,

    private otpService: OTPService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async register(dto: UserDto): Promise<void> {
    const { email, password } = dto;
    email.toLowerCase();
    const existingAdmin = await this.adminRepository.findOne({
      where: { email: email },
    });
    if (existingAdmin) throw new BadRequestException('Email already exists');
    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt());
    const newAdmin = this.adminRepository.create({
      ...dto,
      email: email,
      password: hashedPassword,
    });
    await this.adminRepository.save(newAdmin);
    await this.emailVerification(newAdmin, OTPType.OTP);
  }

  async emailVerification(admin: Admin, otpType: OTPType) {
    const token = await this.otpService.generateTokenForAdmin(
      admin.id,
      otpType,
    );
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
    try {
      const admin = await this.adminRepository.findOne({
        where: { email: email.toLowerCase() },
      });
      if (!admin) throw new NotFoundException(`Admin not found: ${email}`);
      return admin;
    } catch (error) {
      throw new BadRequestException(
        `Error finding email admin: ${error.message}`,
      );
    }
  }

  async findById(id: number): Promise<Admin> {
    try {
      const admin = await this.adminRepository.findOne({ where: { id: id } });
      if (!admin) throw new NotFoundException(`Admin not found: ${id}`);
      return admin;
    } catch (error) {
      throw new BadRequestException(`Error finding admin: ${error.message}`);
    }
  }

  async updateProfile(id: number, data: Partial<Admin>): Promise<Admin> {
    try {
      const admin = await this.adminRepository.findOne({ where: { id: id } });
      if (!admin) throw new NotFoundException(`Admin not found: ${id}`);
      if (
        data.email &&
        (await this.adminRepository.findOne({
          where: { email: data.email },
        }))
      ) {
        throw new BadRequestException('Email already exists');
      }
      data.email.toLowerCase();
      if (
        data.phone &&
        (await this.adminRepository.findOne({ where: { phone: data.phone } }))
      )
        throw new BadRequestException('Phone already exists');
      if (data.password)
        data.password = await bcrypt.hash(
          data.password,
          await bcrypt.genSalt(),
        );
      await this.adminRepository.update({ id: id }, data);
      return await this.adminRepository.findOne({ where: { id: id } });
    } catch (error) {
      throw new BadRequestException(`Error updating admin: ${error.message}`);
    }
  }

  async deleteAccount(id: number): Promise<Object> {
    try {
      const admin = await this.adminRepository.findOne({ where: { id: id } });
      if (!admin) throw new NotFoundException(`Admin not found: ${id}`);
      await this.adminRepository.remove(admin);
      return { message: 'Admin deleted successfully' };
    } catch (error) {
      throw new BadRequestException(`Error deleting admin: ${error.message}`);
    }
  }

  async createUser(dto: UserDto) {
    try {
      const { email, password } = dto;
      email.toLowerCase();
      const existingUser = await this.userRepository.findOne({
        where: { email: email.toLowerCase() },
      });
      if (!existingUser) throw new BadRequestException('Email already exists');
      const hashedPassword = await bcrypt.hash(
        password,
        await bcrypt.genSalt(),
      );
      const newUser = this.userRepository.create({
        ...dto,
        email,
        password: hashedPassword,
      });
      await this.userRepository.save(newUser);
      await this.emailVerificationForUser(newUser, OTPType.OTP);
    } catch (error) {
      throw new BadRequestException(`Error creating user: ${error.message}`);
    }
  }

  async createSaller(dto: UserDto) {
    try {
      const { email, password } = dto;
      email.toLowerCase();
      const existingSaller = await this.sallerRepository.findOne({
        where: { email },
      });
      if (!existingSaller)
        throw new BadRequestException('Email already exists');
      const hashedPassword = await bcrypt.hash(
        password,
        await bcrypt.genSalt(),
      );
      const newSaller = this.sallerRepository.create({
        ...dto,
        email,
        password: hashedPassword,
      });
      await this.sallerRepository.save(newSaller);
      await this.emailVerificationForSaller(newSaller, OTPType.OTP);
    } catch (error) {
      throw new BadRequestException(`Error creating saller: ${error.message}`);
    }
  }

  async getAllUsers() {
    try {
      const users = await this.userRepository.find();
      return users;
    } catch (error) {
      throw new BadRequestException(`Error getting users: ${error.message}`);
    }
  }

  async getAllSallers() {
    try {
      const saller = await this.sallerRepository.find();
      return saller;
    } catch (error) {
      throw new BadRequestException(`Error getting saller: ${error.message}`);
    }
  }
  private async emailVerificationForUser(user: User, otpType: OTPType) {
    const token = await this.otpService.generateTokenForUser(user.id, otpType);
    if (otpType === OTPType.OTP) {
      await this.emailService.sendEmail({
        recipients: [user.email],
        subject: 'OTP for verification',
        html: `Your OTP code is: <strong>${token}</strong>. Provide this OTP to verify your account`,
      });
    }
  }

  private async emailVerificationForSaller(saller: Saller, otpType: OTPType) {
    const token = await this.otpService.generateTokenForSaller(
      saller.id,
      otpType,
    );
    if (otpType === OTPType.OTP) {
      await this.emailService.sendEmail({
        recipients: [saller.email],
        subject: 'OTP for verification',
        html: `Your OTP code is: <strong>${token}</strong>. Provide this OTP to verify your account`,
      });
    }
  }
}
