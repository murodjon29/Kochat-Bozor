import {
  BadRequestException,
  Injectable,
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
    await this.emailVerification(newSaller, OTPType.OTP);
  }

  async emailVerification(saller: Saller, otpType: OTPType) {
    const token = await this.otpService.generateTokenForSaller(
      saller.id,
      otpType,
    );
    if (otpType === OTPType.OTP) {
      await this.emailService.sendEmail({
        recipients: [saller.email],
        subject: 'OTP for verification',
        html: `Your otp code is: <strong>${token}</strong>. Provide this otp to verify your account`,
      });
    } else if (otpType === OTPType.RESET_LINK) {
      const resetLink = `${this.configService.get('RESET_PASSWORD_URL')}?token=${token}`;
      await this.emailService.sendEmail({
        recipients: [saller.email],
        subject: 'Password Reset Link',
        html: `Click the given link to reset your password: <p><a href="${resetLink}">Reset Password</a></p>`,
      });
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
      throw new BadRequestException(
        `Error finding email saller: ${error.message}`,
      );
    }
  }

  async findById(id: number): Promise<Saller> {
    try {
      const saller = await this.sallerRepository.findOne({ where: { id } });
      if (!saller) throw new NotFoundException('Saller not found');
      return saller;
    } catch (error) {
      throw new BadRequestException(`Error finding saller: ${error.message}`);
    }
  }

  async updateProfile(id: number, data: Partial<Saller>): Promise<Saller> {
    try {
      const saller = await this.sallerRepository.findOne({ where: { id } });
      if (!saller) throw new NotFoundException(`Not found saller: ${id}`);
      if (
        data.email &&
        (await this.sallerRepository.findOne({ where: { email: data.email } }))
      )
        throw new BadRequestException('Email already exists');
      if (
        data.phone &&
        (await this.sallerRepository.findOne({ where: { phone: data.phone } }))
      )
        throw new BadRequestException('Phone already exists');
      if (data.password) {
        data.password = await bcrypt.hash(
          data.password,
          await bcrypt.genSalt(),
        );
      }
      await this.sallerRepository.update(id, { ...data });
      const updatedSaller = await this.sallerRepository.findOne({
        where: { id },
      });
      return updatedSaller;
    } catch (error) {
      throw new BadRequestException(`Error updating saller: ${error.message}`);
    }
  }

  async deleteAccount(id: number) {
    try {
      const saller = await this.sallerRepository.findOne({ where: { id } });
      if (!saller) throw new NotFoundException(`Saller not found: ${id}`);
      await this.sallerRepository.delete(id);
      return { message: 'Saller deleted successfully' };
    } catch (error) {
      throw new BadRequestException(`Error deleting saller: ${error.message}`);
    }
  }
}
