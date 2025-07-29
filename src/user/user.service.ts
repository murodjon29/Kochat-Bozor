import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Product } from 'src/saller/entities/product.entiti';
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
    @InjectRepository(Product) private productRepository: Repository<Product>,
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
      if (existingUser) throw new BadRequestException('Email allaqachon mavjud');
      const existingPhoneUser = await this.userRepository.findOne({
        where: { phone },
      });
      if (existingPhoneUser)
        throw new BadRequestException('Telefon raqami allaqachon mavjud');
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
        `Foydalanuvchi yaratishda xato: ${error.message}`,
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
          subject: 'Tasdiqlash uchun OTP',
          html: `Sizning OTP kodingiz: <strong>${token}</strong>. Hisobingizni tasdiqlash uchun ushbu OTP dan foydalaning`,
        });
      } else if (otpType === OTPType.RESET_LINK) {
        const resetLink = `${this.configService.get('RESET_PASSWORD_URL')}?token=${token}`;
        await this.emailService.sendEmail({
          recipients: [user.email],
          subject: 'Parolni tiklash havolasi',
          html: `Parolingizni tiklash uchun quyidagi havolaga bosing: <p><a href="${resetLink}">Parolni tiklash</a></p>`,
        });
      }
    } catch (error) {
      throw new InternalServerErrorException(
        `OTP yuborishda xato: ${error.message}`,
      );
    }
  }

  async getFilter(query: any) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        nomi,
        minPrice,
        maxPrice,
        categoryId,
        region,
        deliveryService,
        minHeight,
        maxHeight,
        minAge,
        maxAge,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = query;

      // Parametrlarni validatsiya qilish
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      if (pageNum < 1 || limitNum < 1) {
        throw new BadRequestException('Sahifa va limit musbat bo‘lishi kerak');
      }
      const skip = (pageNum - 1) * limitNum;

      // QueryBuilder ni boshlash
      const queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.images', 'images')
        .leftJoinAndSelect('product.saller', 'saller')
        .leftJoinAndSelect('product.category', 'category');

      // `search` bo‘yicha filtr (faqat `name` maydonida)
      if (search && typeof search === 'string' && search.trim().length > 0) {
        queryBuilder.andWhere('product.name ILIKE :search', {
          search: `%${search.trim()}%`,
        });
      }

      if (nomi) {
        queryBuilder.andWhere('product.name = :name', {name: nomi})
      }


      // Narx bo‘yicha filtrlar
      if (minPrice) {
        const minPriceValue = parseFloat(minPrice);
        if (isNaN(minPriceValue) || minPriceValue < 0) {
          throw new BadRequestException('Noto‘g‘ri minimal narx');
        }
        queryBuilder.andWhere('product.price >= :minPrice', {
          minPrice: minPriceValue,
        });
      }

      if (maxPrice) {
        const maxPriceValue = parseFloat(maxPrice);
        if (isNaN(maxPriceValue) || maxPriceValue < 0) {
          throw new BadRequestException('Noto‘g‘ri maksimal narx');
        }
        queryBuilder.andWhere('product.price <= :maxPrice', {
          maxPrice: maxPriceValue,
        });
      }

      // Kategoriya bo‘yicha filtr
      if (categoryId) {
        const categoryIdValue = parseInt(categoryId, 10);
        if (isNaN(categoryIdValue)) {
          throw new BadRequestException('Noto‘g‘ri kategoriya ID');
        }
        queryBuilder.andWhere('product.categoryId = :categoryId', {
          categoryId: categoryIdValue,
        });
      }

      // Hudud bo‘yicha filtr
      if (region && typeof region === 'string' && region.trim().length > 0) {
        queryBuilder.andWhere('product.region = :region', {
          region: region.trim(),
        });
      }

      // Yetkazib berish xizmati bo‘yicha filtr
      if (deliveryService) {
        const deliveryServiceValue = deliveryService === 'true' || deliveryService === true;
        queryBuilder.andWhere('product.deliveryService = :deliveryService', {
          deliveryService: deliveryServiceValue,
        });
      }

      // Balandlik bo‘yicha filtrlar
      if (minHeight) {
        const minHeightValue = parseFloat(minHeight);
        if (isNaN(minHeightValue) || minHeightValue < 0) {
          throw new BadRequestException('Noto‘g‘ri minimal balandlik');
        }
        queryBuilder.andWhere('product.height >= :minHeight', {
          minHeight: minHeightValue,
        });
      }

      if (maxHeight) {
        const maxHeightValue = parseFloat(maxHeight);
        if (isNaN(maxHeightValue) || maxHeightValue < 0) {
          throw new BadRequestException('Noto‘g‘ri maksimal balandlik');
        }
        queryBuilder.andWhere('product.height <= :maxHeight', {
          maxHeight: maxHeightValue,
        });
      }

      // Yosh bo‘yicha filtrlar
      if (minAge) {
        const minAgeValue = parseInt(minAge, 10);
        if (isNaN(minAgeValue) || minAgeValue < 0) {
          throw new BadRequestException('Noto‘g‘ri minimal yosh');
        }
        queryBuilder.andWhere('product.age >= :minAge', {
          minAge: minAgeValue,
        });
      }

      if (maxAge) {
        const maxAgeValue = parseInt(maxAge, 10);
        if (isNaN(maxAgeValue) || maxAgeValue < 0) {
          throw new BadRequestException('Noto‘g‘ri maksimal yosh');
        }
        queryBuilder.andWhere('product.age <= :maxAge', {
          maxAge: maxAgeValue,
        });
      }

      // Saralash
      const validSortFields = ['createdAt', 'price', 'name', 'age', 'height'];
      if (!validSortFields.includes(sortBy)) {
        throw new BadRequestException('Noto‘g‘ri saralash maydoni');
      }
      const validSortOrders = ['ASC', 'DESC'];
      const normalizedSortOrder = sortOrder.toUpperCase();
      if (!validSortOrders.includes(normalizedSortOrder)) {
        throw new BadRequestException('Noto‘g‘ri saralash tartibi');
      }
      queryBuilder.orderBy(`product.${sortBy}`, normalizedSortOrder);

      // Sahifalash
      queryBuilder.skip(skip).take(limitNum);

      // Natijalarni olish
      const [products, total] = await queryBuilder.getManyAndCount();

      // Agar hech qanday mahsulot topilmasa
      if (!products || products.length === 0) {
        return {
          data: [],
          total: 0,
          page: pageNum,
          limit: limitNum,
          totalPages: 0,
        };
      }

      return {
        data: products,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      };
    } catch (error) {
      console.error('Mahsulotlarni olishda xato:', error.message);
      throw new InternalServerErrorException(
        `Mahsulotlarni olishda xato: ${error.message}`,
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
        throw new NotFoundException(`Foydalanuvchi topilmadi: ${email}`);
      return user;
    } catch (error) {
      throw new InternalServerErrorException(
        `Foydalanuvchi qidirishda xato: ${error.message}`,
      );
    }
  }

  async findAllUser(): Promise<User[]> {
    try {
      const users = await this.userRepository.find();
      if (!users || users.length === 0) {
        console.log('Ma\'lumotlar bazasida foydalanuvchilar topilmadi');
      }
      return users;
    } catch (error) {
      throw new InternalServerErrorException(
        `Foydalanuvchilarni qidirishda xato: ${error.message}`,
      );
    }
  }

  async findById(id: number): Promise<User> {
    try {
      if (isNaN(id)) throw new BadRequestException('Noto‘g‘ri foydalanuvchi ID');
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) throw new NotFoundException(`Foydalanuvchi topilmadi: ${id}`);
      return user;
    } catch (error) {
      throw new InternalServerErrorException(
        `Foydalanuvchi qidirishda xato: ${error.message}`,
      );
    }
  }

  async updateProfile(id: number, data: Partial<User>): Promise<User> {
    try {
      if (isNaN(id)) throw new BadRequestException('Noto‘g‘ri foydalanuvchi ID');
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) throw new NotFoundException(`Foydalanuvchi topilmadi: ${id}`);
      if (
        data.email &&
        (await this.userRepository.findOne({
          where: { email: data.email.toLowerCase() },
        }))
      ) {
        throw new BadRequestException('Email allaqachon mavjud');
      }
      if (
        data.phone &&
        (await this.userRepository.findOne({ where: { phone: data.phone } }))
      ) {
        throw new BadRequestException('Telefon raqami allaqachon mavjud');
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
        `Foydalanuvchi profilini yangilashda xato: ${error.message}`,
      );
    }
  }

  async deleteAccount(id: number): Promise<{ message: string }> {
    try {
      if (isNaN(id)) throw new BadRequestException('Noto‘g‘ri foydalanuvchi ID');
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) throw new NotFoundException(`Foydalanuvchi topilmadi: ${id}`);
      await this.userRepository.delete(id);
      return { message: 'Foydalanuvchi muvaffaqiyatli o‘chirildi' };
    } catch (error) {
      throw new InternalServerErrorException(
        `Foydalanuvchi o‘chirishda xato: ${error.message}`,
      );
    }
  }
}