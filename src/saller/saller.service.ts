import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Saller } from './entities/saller.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { OTPService } from 'src/utils/otp/otp.service';
import { UserDto } from 'src/user/dto/user.dto';
import { EmailService } from 'src/email/email.service';
import { OTPType } from 'src/utils/otp/types/otp-type';
import { CreateProductDto } from './dto/product.dto';
import { FileService } from 'src/utils/file/file.service';
import { Product } from './entities/product.entiti';
import { ProductImage } from './entities/image.entitiy';
import { UpdateDto } from './dto/updet.dto';
import { UpdateSallerDto } from './dto/update-saller.dto';
import { Category } from 'src/category/entities/category.entity';
import { CreateSallerDto } from './dto/create.saller.dto';
import { Order } from 'src/order/entities/order.entity';

@Injectable()
export class SallerService {
  constructor(
    @InjectRepository(Saller) private sallerRepository: Repository<Saller>,
    @InjectRepository(Product) private productRepository: Repository<Product>,
    @InjectRepository(Order) private orderRepository: Repository<Order>,
    @InjectRepository(ProductImage)
    private imageRepository: Repository<ProductImage>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private readonly dataSource: DataSource,
    private otpService: OTPService,
    private emailService: EmailService,
    private configService: ConfigService,
    private readonly fileService: FileService,
  ) {}

  async createProduct(
    dto: CreateProductDto,
    files: Express.Multer.File[],
    id: number
  ): Promise<Object> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const category = await queryRunner.manager.findOne(Category, {
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new BadRequestException(
          `Kategoriya topilmadi: ID ${dto.categoryId}`,
        );
      }

      const saller = await queryRunner.manager.findOne(Saller, {
        where: { id: dto.sallerId },
      });
      if (!saller) {
        throw new NotFoundException(`Sotuvchi topilmadi: ID ${dto.sallerId}`);
      }

      if (dto.stock <= 0) {
        throw new BadRequestException(
          'Zaxira miqdori 0 dan katta bo‘lishi kerak',
        );
      }
      const product = queryRunner.manager.create(Product, {
        ...dto,
        saller, 
        category, 
      });


      await queryRunner.manager.save(Product, product);
      if (files && files.length > 0) {
        const productImages: ProductImage[] = [];
        for (const file of files) {
          const imagePath = await this.fileService.createFile(file);
          const productImage = queryRunner.manager.create(ProductImage, {
            product,
            ImageUrl: imagePath,
          });
          await queryRunner.manager.save(ProductImage, productImage);
          productImages.push(productImage);
        }
        product.images = productImages;
        await queryRunner.manager.save(Product, product);
      }

      await queryRunner.commitTransaction();
      return {
        message: 'Mahsulot muvaffaqiyatli yaratildi',
        productId: product.id,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        `Mahsulot yaratishda xato: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async register(dto: CreateSallerDto): Promise<void> {
    try {
      const { email, password, phone } = dto;
      console.log(dto);

      const normalizedEmail = email.toLowerCase();
      const existingSaller = await this.sallerRepository.findOne({
        where: { email: normalizedEmail },
      });
      if (existingSaller)
        throw new BadRequestException('Email allaqachon mavjud');
      const existingPhoneSaller = await this.sallerRepository.findOne({
        where: { phone },
      });
      if (existingPhoneSaller)
        throw new BadRequestException('Telefon raqami allaqachon mavjud');
      const hashedPassword = await bcrypt.hash(
        password,
        await bcrypt.genSalt(),
      );
      const newSaller = this.sallerRepository.create({
        ...dto,
        email: normalizedEmail,
        password: hashedPassword,
      });
      await this.sallerRepository.save(newSaller);
      return this.emailVerification(newSaller, OTPType.OTP);
    } catch (error) {
      throw new InternalServerErrorException(
        `Sotuvchi yaratishda xato: ${error.message}`,
      );
    }
  }

  async emailVerification(saller: Saller, otpType: OTPType) {
    try {
      const token = await this.otpService.generateTokenForSaller(
        saller.id,
        otpType,
      );
      if (otpType === OTPType.OTP) {
        await this.emailService.sendEmail({
          recipients: [saller.email],
          subject: 'Tasdiqlash uchun code',
          html: `Sizning code kodingiz: <strong>${token}</strong>. Hisobingizni tasdiqlash uchun ushbu  dan foydalaning`,
        });
      } else if (otpType === OTPType.RESET_LINK) {
        const resetLink = `${this.configService.get('RESET_PASSWORD_URL')}?token=${token}`;
        await this.emailService.sendEmail({
          recipients: [saller.email],
          subject: 'Parolni tiklash havolasi',
          html: `Parolingizni tiklash uchun quyidagi havolaga bosing: <p><a href="${resetLink}">Parolni tiklash</a></p>`,
        });
      }
    } catch (error) {
      throw new InternalServerErrorException(
        `Sotuvchiga tasdiqlash emaili yuborishda xato: ${error.message}`,
      );
    }
  }

  async findByEmail(email: string): Promise<Saller> {
    try {
      const normalizedEmail = email.toLowerCase();
      console.log(`Sotuvchi qidirilmoqda, email: ${normalizedEmail}`);
      const saller = await this.sallerRepository.findOne({
        where: { email: normalizedEmail },
      });
      if (!saller) throw new NotFoundException(`Sotuvchi topilmadi: ${email}`);
      return saller;
    } catch (error) {
      throw new InternalServerErrorException(
        `Sotuvchi qidirishda xato: ${error.message}`,
      );
    }
  }

  async findAllSallers(): Promise<Saller[]> {
    try {
      const sallers = await this.sallerRepository.find();
      if (!sallers || sallers.length === 0) {
        console.log("Ma'lumotlar bazasida sotuvchilar topilmadi");
      }
      return sallers;
    } catch (error) {
      throw new InternalServerErrorException(
        `Sotuvchilarni qidirishda xato: ${error.message}`,
      );
    }
  }

  async findById(id: number): Promise<Saller> {
    try {
      if (isNaN(id)) throw new BadRequestException('Noto‘g‘ri sotuvchi ID');
      const saller = await this.sallerRepository.findOne({ where: { id } });
      if (!saller) throw new NotFoundException(`Sotuvchi topilmadi: ${id}`);
      return saller;
    } catch (error) {
      throw new InternalServerErrorException(
        `Sotuvchi qidirishda xato: ${error.message}`,
      );
    }
  }

  async updateProfile(id: number, data: UpdateSallerDto): Promise<Saller> {
    try {
      if (isNaN(id)) throw new BadRequestException('Noto‘g‘ri sotuvchi ID');
      const saller = await this.sallerRepository.findOne({ where: { id } });
      if (!saller) throw new NotFoundException(`Sotuvchi topilmadi: ${id}`);
      if (
        typeof data.email === 'string' &&
        data.email.toLowerCase() !== saller.email
      ) {
        const emailExists = await this.sallerRepository.findOne({
          where: { email: data.email.toLowerCase() },
        });
        if (emailExists)
          throw new BadRequestException('Email allaqachon mavjud');
      }
      if (data.phone && data.phone !== saller.phone) {
        const phoneExists = await this.sallerRepository.findOne({
          where: { phone: data.phone },
        });
        if (phoneExists)
          throw new BadRequestException('Telefon raqami allaqachon mavjud');
      }
      if (data.password) {
        data.password = await bcrypt.hash(
          data.password,
          await bcrypt.genSalt(),
        );
      }
      await this.sallerRepository.update(id, data);
      return await this.sallerRepository.findOne({ where: { id },  relations: ['products'] });
    } catch (error) {
      throw new InternalServerErrorException(
        `Sotuvchi profilini yangilashda xato: ${error.message}`,
      );
    };
  }
  

  async deleteAccount(id: number): Promise<{ message: string }> {
    try {
      if (isNaN(id)) throw new BadRequestException('Noto‘g‘ri sotuvchi ID');
      const saller = await this.sallerRepository.findOne({ where: { id } });
      if (!saller) throw new NotFoundException(`Sotuvchi topilmadi: ${id}`);
      await this.sallerRepository.delete(id);
      return { message: 'Sotuvchi muvaffaqiyatli o‘chirildi' };
    } catch (error) {
      throw new InternalServerErrorException(
        `Sotuvchi o‘chirishda xato: ${error.message}`,
      );
    }
  }

  async myProducts(id: number) {
    try {
      if (isNaN(id)) throw new BadRequestException('Noto‘g‘ri mahsulot ID');
      const product = await this.productRepository.find({
        where: { saller: { id } },
        relations: ['images', 'saller',  'category'],
      });
      if (!product) throw new NotFoundException(`Mahsulot topilmadi: ${id}`);
      return product;
    } catch (error) {
      throw new InternalServerErrorException(
        `Mahsulot olishda xato: ${error.message}`,
      );
    }
  }

  async myOrders(id: number) {
    try {
      const orders = await this.orderRepository.find({
        where: { user: { id } },
        relations: ['product', 'user'],
      })
      if (!orders) throw new NotFoundException(`Mahsulot topilmadi: ${id}`);
      return orders
    } catch (error) {
      throw new InternalServerErrorException(
        `Mahsulot olishda xato: ${error.message}`,
      )
    }
  }

  async getAllProducts() {
    try {
      const products = await this.productRepository.find({
        relations: {
          images: true,
          saller: true,
          category: true,
        },
      });
      if (!products || products.length === 0) {
        console.log("Ma'lumotlar bazasida mahsulotlar topilmadi");
      }
      return products;
    } catch (error) {
      throw new InternalServerErrorException(
        `Mahsulotlarni olishda xato: ${error.message}`,
      );
    }
  }

  async updateProduct(
  id: number,
  dto: UpdateDto,
  files: Express.Multer.File[],
): Promise<Product> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    const { categoryId } = dto;
    const category = await queryRunner.manager.findOne(Category, {
      where: { id: categoryId },
    });
    if (dto.categoryId && !category)
      throw new BadRequestException('Kategoriya topilmadi');
    if (dto.stock <= 0)
      throw new BadRequestException(
        'Zaxira miqdori 0 dan katta bo‘lishi kerak',
      );

    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['images'],
    });
    if (!product) throw new NotFoundException(`Mahsulot topilmadi: ${id}`);

    Object.assign(product, { ...dto, category });
    await queryRunner.manager.save(product);

    if (files && files.length > 0) {
      if (product.images && product.images.length > 0) {
        for (const image of product.images) {
          await this.fileService.deleteFile(image.ImageUrl);
          await queryRunner.manager.delete(ProductImage, image.id);
        }
      }
      const productImages: ProductImage[] = [];
      for (const file of files) {
        const imagePath = await this.fileService.createFile(file);
        const productImage = queryRunner.manager.create(ProductImage, {
          product,
          ImageUrl: imagePath,
        });
        await queryRunner.manager.save(productImage);
        productImages.push(productImage);
      }

      product.images = productImages;
      await queryRunner.manager.save(product);
    }

    await queryRunner.commitTransaction();

    const updatedProduct = await this.productRepository.findOne({
      where: { id },
      relations: ['images', 'saller', 'category'],
    });

    return updatedProduct;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw new InternalServerErrorException(
      `Mahsulot yangilashda xato: ${error.message}`,
    );
  } finally {
    await queryRunner.release();
  }
}


  async deleteProduct(id: number): Promise<{ message: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if (isNaN(id)) throw new BadRequestException('Noto‘g‘ri mahsulot ID');
      const product = await this.productRepository.findOne({
        where: { id },
        relations: ['images'],
      });
      if (!product) throw new NotFoundException(`Mahsulot topilmadi: ${id}`);
      if (product.images && product.images.length > 0) {
        for (const image of product.images) {
          await this.fileService.deleteFile(image.ImageUrl);
          await queryRunner.manager.delete(ProductImage, image.id);
        }
      }
      await queryRunner.manager.delete(Product, id);
      await queryRunner.commitTransaction();
      return { message: 'Mahsulot muvaffaqiyatli o‘chirildi' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        `Mahsulot o‘chirishda xato: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }


}
