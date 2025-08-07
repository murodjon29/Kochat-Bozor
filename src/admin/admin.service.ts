import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
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
import { CreateProductDto } from 'src/saller/dto/product.dto';
import { updateAdminDto } from './auth/dto/update.admin.dto';
import { Role } from 'src/utils/enum';
import { CreateSallerDto } from 'src/saller/dto/create.saller.dto';

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    @InjectRepository(Admin) private adminRepository: Repository<Admin>,
    private readonly userService: UserService,
    private readonly sallerService: SallerService,
    private readonly otpService: OTPService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      console.log('Checking for existing admin with email: admin@gmail.com');
      const existingAdmin = await this.adminRepository.findOne({
        where: { email: 'admin@gmail.com' },
      });

      if (!existingAdmin) {
        console.log('No admin found, creating new admin');
        const hashedPassword = await bcrypt.hash('admin', 10);
        const admin = this.adminRepository.create({
          email: 'admin@gmail.com',
          password: hashedPassword,
          role: Role.ADMIN,
        });
        await this.adminRepository.save(admin);
        console.log('Admin created successfully: admin@gmail.com');
      } else {
        console.log('Admin already exists: admin@gmail.com');
      }
    } catch (error) {
      console.error('Error creating admin:', error.message);
      throw new InternalServerErrorException(
        `Error initializing admin: ${error.message}`,
      );
    }
  }

  async findOneUser(id: number) {
    try {
      const user = await this.userService.findById(id);
      if (!user) throw new NotFoundException(`User not found: ${id}`);
      return user;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error finding user: ${error.message}`,
      )
    }
  }

  async findOneSaller(id: number) {
    try {
      const saller = await this.sallerService.findById(id);
      if (!saller) throw new NotFoundException(`Saller not found: ${id}`);
      return saller;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error finding saller: ${error.message}`,
      )
    }
  }

  async findById(id: number): Promise<Admin> {
    try {
      if (isNaN(id)) throw new BadRequestException('Invalid admin ID');
      const admin = await this.adminRepository.findOne({ where: { id } });
      if (!admin) throw new NotFoundException(`Admin not found: ${id}`);
      return admin;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error finding admin: ${error.message}`,
      );
    }
  }

  async updateProfile(email: string, data: updateAdminDto) {
    try {
      // if (isNaN(id)) throw new BadRequestException('Invalid admin ID');
      // const admin = await this.findById(id);
      // if (data.email && data.email.toLowerCase() !== admin.email) {
      //   const emailExists = await this.adminRepository.findOne({
      //     where: { email: data.email.toLowerCase() },
      //   });
      //   if (emailExists) throw new BadRequestException('Email already exists');
      // }
      // if (data.phone && data.phone !== admin.phone) {
      //   const phoneExists = await this.adminRepository.findOne({
      //     where: { phone: data.phone },
      //   });
      //   if (phoneExists) throw new BadRequestException('Phone already exists');
      // }
      // if (data.password) {
      //   data.password = await bcrypt.hash(data.password, await bcrypt.genSalt());
      // }
      // await this.adminRepository.update(id, data);
      // return await this.findById(id);
      //   const admin = await this.adminRepository.findOne({ where: { email: email.toLowerCase() } });
      //   if(email !== 'admin@gmail.com'){
      //     return
      //   }
    } catch (error) {
      throw new InternalServerErrorException(
        `Error updating admin: ${error.message}`,
      );
    }
  }

  async deleteAccount(id: number): Promise<{ message: string }> {
    try {
      if (isNaN(id)) throw new BadRequestException('Invalid admin ID');
      const admin = await this.findById(id);
      await this.adminRepository.remove(admin);
      return { message: 'Admin deleted successfully' };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error deleting admin: ${error.message}`,
      );
    }
  }

  async createUser(dto: UserDto): Promise<{ message: string }> {
    try {
      await this.userService.register(dto);
      const user = await this.userService.findByEmail(dto.email.toLowerCase());
      await this.userService.emailVerification(user, OTPType.OTP);
      return { message: 'User created successfully and OTP sent to email' };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error creating user: ${error.message}`,
      );
    }
  }

  async createSaller(dto: CreateSallerDto): Promise<{ message: string }> {
    try {
      await this.sallerService.register(dto);
      const saller = await this.sallerService.findByEmail(
        dto.email.toLowerCase(),
      );
      await this.sallerService.emailVerification(saller, OTPType.OTP);
      return { message: 'Saller created successfully and OTP sent to email' };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error creating saller: ${error.message}`,
      );
    }
  }

  async getAdmins(): Promise<Admin[]> {
    try {
      const admins = await this.adminRepository.find();
      if (!admins.length) throw new NotFoundException('No admins found');
      return admins;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error finding admins: ${error.message}`,
      );
    }
  }

  async getAllUser() {
    try {
      const users = await this.userService.findAllUser();
      if (!users.length) throw new NotFoundException('No users found');
      return users;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error finding users: ${error.message}`,
      );
    }
  }

  async getAllSaller() {
    try {
      const sallers = await this.sallerService.findAllSallers();
      if (!sallers.length) throw new NotFoundException('No sallers found');
      return sallers;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error finding sallers: ${error.message}`,
      );
    }
  }

  async deleteProduct(id: number) {
    // try {
    //   if (isNaN(id)) throw new BadRequestException('Invalid product ID');
    //   this.sallerService.(id);
    //   return { message: 'Product deleted successfully' };
    // } catch (error) {
    //   throw new InternalServerErrorException(
    //     `Error deleting product: ${error.message}`,
    //   );
    // }
  }

  async deleteSaller(id: number) {
    try {
      const saller = await this.sallerService.findById(id);
      if (!saller) throw new NotFoundException(`Saller not found: ${id}`);
      await this.sallerService.deleteAccount(id);
      return { message: 'Saller deleted successfully' };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error deleting saller: ${error.message}`,
      );
    }
  }

  async deleteUser(id: number) {
    try {
      const user = await this.userService.findById(id);
      if (!user) throw new NotFoundException(`User not found: ${id}`);
      await this.userService.deleteAccount(id);
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error deleting user: ${error.message}`,
      );
    }
  }
}
