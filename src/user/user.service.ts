import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
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
import { Product } from 'src/saller/entities/product.entiti';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>, 
    private otpService: OTPService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async register(dto: UserDto): Promise<void> {
    try {
      const { email, password, phone } = dto;
      const normalizedEmail = email.toLowerCase();
      const existingUser = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });
      if (existingUser) throw new BadRequestException('Email already exists');
      const existingPhoneUser = await this.userRepository.findOne({
        where: { phone },
      });
      if (existingPhoneUser)
        throw new BadRequestException('Phone already exists');
      const hashedPassword = await bcrypt.hash(
        password,
        await bcrypt.genSalt(),
      );
      const newUser = this.userRepository.create({
        ...dto,
        email: normalizedEmail,
        password: hashedPassword,
      });
      await this.userRepository.save(newUser);
      return this.emailVerification(newUser, OTPType.OTP);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error creating user: ${error.message}`,
      );
    }
  }

  async emailVerification(user: User, otpType: OTPType) {
    try {
      const token = await this.otpService.generateTokenForUser(
        user.id,
        otpType,
      );
      if (otpType === OTPType.OTP) {
        await this.emailService.sendEmail({
          recipients: [user.email],
          subject: 'OTP for verification',
          html: `Your OTP code is: <strong>${token}</strong>. Provide this OTP to verify your account`,
        });
      } else if (otpType === OTPType.RESET_LINK) {
        const resetLink = `${this.configService.get('RESET_PASSWORD_URL')}?token=${token}`;
        await this.emailService.sendEmail({
          recipients: [user.email],
          subject: 'Password Reset Link',
          html: `Click the given link to reset your password: <p><a href="${resetLink}">Reset Password</a></p>`,
        });
      }
    } catch (error) {
      throw new InternalServerErrorException(
        `Error sending OTP to user: ${error.message}`,
      );
    }
  }

  async findByEmail(email: string): Promise<User> {
    try {
      const normalizedEmail = email.toLowerCase();
      const user = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });
      if (!user)
        throw new NotFoundException(`User not found with email: ${email}`);
      return user;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error finding user: ${error.message}`,
      );
    }
  }

  async findAllUser(): Promise<User[]> {
    try {
      const users = await this.userRepository.find();
      if (!users || users.length === 0) {
        console.log('No users found in the database');
      }
      return users;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error finding users: ${error.message}`,
      );
    }
  }

  async findById(id: number): Promise<User> {
    try {
      if (isNaN(id)) throw new BadRequestException('Invalid user ID');
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) throw new NotFoundException(`User not found: ${id}`);
      return user;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error finding user: ${error.message}`,
      );
    }
  }

  async updateProfile(id: number, data: Partial<User>): Promise<User> {
    try {
      if (isNaN(id)) throw new BadRequestException('Invalid user ID');
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) throw new NotFoundException(`User not found: ${id}`);
      if (
        data.email &&
        (await this.userRepository.findOne({
          where: { email: data.email.toLowerCase() },
        }))
      ) {
        throw new BadRequestException('Email already exists');
      }
      if (
        data.phone &&
        (await this.userRepository.findOne({ where: { phone: data.phone } }))
      ) {
        throw new BadRequestException('Phone already exists');
      }
      if (data.password) {
        data.password = await bcrypt.hash(
          data.password,
          await bcrypt.genSalt(),
        );
      }
      await this.userRepository.update(id, data);
      return await this.userRepository.findOne({ where: { id } });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error updating user: ${error.message}`,
      );
    }
  }

  async deleteAccount(id: number): Promise<{ message: string }> {
    try {
      if (isNaN(id)) throw new BadRequestException('Invalid user ID');
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) throw new NotFoundException(`User not found: ${id}`);
      await this.userRepository.delete(id);
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error deleting user: ${error.message}`,
      );
    }
  }

  async getAllProduct(query: any) {
    try {
     const product = await this.productRepository.createQueryBuilder('product')
        .leftJoinAndSelect('product.images', 'images')
        .leftJoinAndSelect('product.saller', 'saller')
        .leftJoinAndSelect('product.category', 'category')

      
    } catch (error) {
      console.error('Error finding products:', error.message);
      throw new InternalServerErrorException(`Error finding product: ${error.message}`);
    }
  }
}
