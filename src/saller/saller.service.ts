import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Saller } from './entities/saller.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { OTPService } from 'src/utils/otp/otp.service';
import { UserDto } from 'src/user/dto/user.dto';
import { EmailService } from 'src/email/email.service';
import { OTPType } from 'src/utils/otp/types/otp-type';

@Injectable()
export class SallerService {
  constructor(
    @InjectRepository(Saller) private sallerRepository: Repository<Saller>,
    private otpService: OTPService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async register(dto: UserDto): Promise<void> {
    try {
      
      const { email, password } = dto;
      const existingSaller = await this.sallerRepository.findOne({
        where: { email: email.toLowerCase() },
      });
      if (existingSaller) throw new BadRequestException('Email already exists');
      const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt());
      const newSaller = this.sallerRepository.create({
        ...dto,
        email: email.toLowerCase(),
        password: hashedPassword,
      });
      await this.sallerRepository.save(newSaller);
      return this.emailVerification(newSaller, OTPType.OTP);
    } catch (error) {
      throw new InternalServerErrorException(`Error creating saller: ${error.message}`);
    }
  }

  async emailVerification(saller: Saller, otpType: OTPType) {
    try {
      const token = await this.otpService.generateTokenForSaller(saller.id, otpType);
      if (otpType === OTPType.OTP) {
        await this.emailService.sendEmail({
          recipients: [saller.email],
          subject: 'OTP for verification',
          html: `Your OTP code is: <strong>${token}</strong>. Provide this OTP to verify your account`,
        });
      } else if (otpType === OTPType.RESET_LINK) {
        const resetLink = `${this.configService.get('RESET_PASSWORD_URL')}?token=${token}`;
        await this.emailService.sendEmail({
          recipients: [saller.email],
          subject: 'Password Reset Link',
          html: `Click the given link to reset your password: <p><a href="${resetLink}">Reset Password</a></p>`,
        });
      }
    } catch (error) {
      throw new InternalServerErrorException(`Error sending verification email for saller: ${error.message}`);
    }
  }

  async findByEmail(email: string): Promise<Saller> {
    try {
      const saller = await this.sallerRepository.findOne({
        where: { email: email.toLowerCase() },
      });
      if (!saller) throw new NotFoundException('Saller not found');
      return saller;
    } catch (error) {
      throw new InternalServerErrorException(`Error finding saller: ${error.message}`);
    }
  }

  async findAllSallers(): Promise<Saller[]> {
    try {
      const sallers = await this.sallerRepository.find();
      if (!sallers || sallers.length === 0) {
        console.log('No sallers found in the database');
      }
      return sallers;
    } catch (error) {
      throw new InternalServerErrorException(`Error finding sallers: ${error.message}`);
    }
  }

  async findById(id: number): Promise<Saller> {
    try {
      if (isNaN(id)) throw new BadRequestException('Invalid saller ID');
      const saller = await this.sallerRepository.findOne({ where: { id } });
      if (!saller) throw new NotFoundException(`Saller not found: ${id}`);
      return saller;
    } catch (error) {
      throw new InternalServerErrorException(`Error finding saller: ${error.message}`);
    }
  }

  async updateProfile(id: number, data: Partial<Saller>): Promise<Saller> {
    try {
      if (isNaN(id)) throw new BadRequestException('Invalid saller ID');
      const saller = await this.sallerRepository.findOne({ where: { id } });
      if (!saller) throw new NotFoundException(`Saller not found: ${id}`);
      if (data.email && (await this.sallerRepository.findOne({ where: { email: data.email.toLowerCase() } }))) {
        throw new BadRequestException('Email already exists');
      }
      if (data.phone && (await this.sallerRepository.findOne({ where: { phone: data.phone } }))) {
        throw new BadRequestException('Phone already exists');
      }
      if (data.password) {
        data.password = await bcrypt.hash(data.password, await bcrypt.genSalt());
      }
      await this.sallerRepository.update(id, data);
      return await this.sallerRepository.findOne({ where: { id } });
    } catch (error) {
      throw new InternalServerErrorException(`Error updating saller: ${error.message}`);
    }
  }

  async deleteAccount(id: number): Promise<{ message: string }> {
    try {
      if (isNaN(id)) throw new BadRequestException('Invalid saller ID');
      const saller = await this.sallerRepository.findOne({ where: { id } });
      if (!saller) throw new NotFoundException(`Saller not found: ${id}`);
      await this.sallerRepository.delete(id);
      return { message: 'Saller deleted successfully' };
    } catch (error) {
      throw new InternalServerErrorException(`Error deleting saller: ${error.message}`);
    }
  }
}