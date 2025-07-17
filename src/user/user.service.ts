import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UserDto } from './dto/user.dto';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { OTPService } from 'src/utils/otp/otp.service';
import { EmailService } from 'src/email/email.service';
import { OTPType } from 'src/utils/otp/types/otp-type';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private otpService: OTPService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async register(dto: UserDto): Promise<void> {
    const { email, password } = dto;
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) throw new BadRequestException('Email already exists');
    const existingPhone = await this.userRepository.findOne({
      where: { phone: dto.phone },
    });
    if (existingPhone) throw new BadRequestException('Phone already exists');
    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt());
    const newUser = this.userRepository.create({
      ...dto,
      email: email.toLowerCase(),
      password: hashedPassword,
    });
    await this.userRepository.save(newUser);
    await this.emailVerification(newUser, OTPType.OTP);
  }

  async emailVerification(user: User, otpType: OTPType) {
    const token = await this.otpService.generateTokenForUser(user.id, otpType);
    if (otpType === OTPType.OTP) {
      await this.emailService.sendEmail({
        recipients: [user.email],
        subject: 'OTP for verification',
        html: `Your otp code is: <strong>${token}</strong>. Provide this otp to verify your account`,
      });
    } else if (otpType === OTPType.RESET_LINK) {
      const resetLink = `${this.configService.get('RESET_PASSWORD_URL')}?token=${token}`;
      await this.emailService.sendEmail({
        recipients: [user.email],
        subject: 'Password Reset Link',
        html: `Click the given link to reset your password: <p><a href="${resetLink}">Reset Password</a></p>`,
      });
    }
  }

  async findByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: number): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) throw new NotFoundException('User not found');
      return user;
    } catch (error) {
      throw new BadRequestException(`Error finding user: ${error.message}`);
    }
  }

  async updateProfile(id: number, data: Partial<User>): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) throw new NotFoundException(`Not found user: ${id}`);
      if (
        data.email &&
        (await this.userRepository.findOne({ where: { email: data.email } }))
      )
        throw new BadRequestException('Email already exits');
      if (
        data.phone &&
        (await this.userRepository.findOne({ where: { phone: data.phone } }))
      )
        throw new BadRequestException('Phone already exits');
      if (data.password) {
        data.password = await bcrypt.hash(
          data.password,
          await bcrypt.genSalt(),
        );
      }
      await this.userRepository.update(id, { ...data });
      const updatedUser = await this.userRepository.findOne({ where: { id } });
      return updatedUser;
    } catch (error) {
      throw new BadRequestException(`Error updating user: ${error.message}`);
    }
  }

  async deleteAccount(id: number) {
    try {
      const user = await this.userRepository.findBy({ id });
      if (!user) throw new NotFoundException(`User not found: ${id}`);
      await this.userRepository.delete(id);
      return { message: 'User deleted succesfully' };
    } catch (error) {
      throw new BadRequestException(`Error deleting user: ${error.message}`);
    }
  }
}
