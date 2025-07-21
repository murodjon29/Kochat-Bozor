import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../entities/admin.entity';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminLoginDto } from './dto/admin-login.dto';
import { Role } from 'src/utils/enum';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(Admin) private adminRepository: Repository<Admin>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  

  async login(dto: AdminLoginDto) {
    const { email, password } = dto;

    console.log(`Attempting to login admin with email: ${email}`);

    // Ichki validateAdmin funksiyasi
    const validateAdmin = async (
      email: string,
      password: string,
    ): Promise<any> => {
      if (!email || typeof email !== 'string') {
        console.warn('Invalid email format:', email);
        throw new BadRequestException('Email notogri formatda');
      }

      const normalizedEmail = email.toLowerCase().trim();
      console.log(`Normalized email: ${normalizedEmail}`);

      const admin = await this.adminRepository.findOne({
        where: { email: normalizedEmail },
      });
      if (!admin) {
        console.warn(`Admin not found for email: ${normalizedEmail}`);
        throw new UnauthorizedException('Email mavjud emas');
      }

      const passwordMatch = await bcrypt.compare(password, admin.password);
      if (!passwordMatch) {
        console.warn(`Password mismatch for email: ${normalizedEmail}`);
        throw new UnauthorizedException('Notogri ma’lumotlar');
      }

      return { id: admin.id, email: admin.email, role: admin.role || 'ADMIN' };
    };

    const admin = await validateAdmin(email, password);

    const payload = { id: admin.id, email: admin.email, role: admin.role };
    console.log('Admin JWT payload:', payload);

    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1h',
      }),
      userId: admin.id,
      email: admin.email,
      role: admin.role,
    };
  }
}
