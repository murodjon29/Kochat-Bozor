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

@Injectable()
export class SallerService {
  constructor(
    @InjectRepository(Saller) private sallerRepository: Repository<Saller>,
    @InjectRepository(Product) private productRepository: Repository<Product>,
    @InjectRepository(ProductImage) private imageRepository: Repository<ProductImage>,
    private readonly dataSource: DataSource,
    private otpService: OTPService,
    private emailService: EmailService,
    private configService: ConfigService,
    private readonly fileService: FileService,
  ) {}

  async register(dto: UserDto): Promise<void> {
    try {
      const { email, password, phone } = dto;
      const normalizedEmail = email.toLowerCase();
      const existingSaller = await this.sallerRepository.findOne({
        where: { email: normalizedEmail },
      });
      if (existingSaller) throw new BadRequestException('Email already exists');
      const existingPhoneSaller = await this.sallerRepository.findOne({
        where: { phone },
      });
      if (existingPhoneSaller) throw new BadRequestException('Phone already exists');
      const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt());
      const newSaller = this.sallerRepository.create({
        ...dto,
        email: normalizedEmail,
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
      const normalizedEmail = email.toLowerCase();
      console.log(`Searching for saller with email: ${normalizedEmail}`);
      const saller = await this.sallerRepository.findOne({
        where: { email: normalizedEmail },
      });
      if (!saller) throw new NotFoundException(`Saller not found with email: ${email}`);
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
      if (data.email && data.email.toLowerCase() !== saller.email) {
        const emailExists = await this.sallerRepository.findOne({
          where: { email: data.email.toLowerCase() },
        });
        if (emailExists) throw new BadRequestException('Email already exists');
      }
      if (data.phone && data.phone !== saller.phone) {
        const phoneExists = await this.sallerRepository.findOne({
          where: { phone: data.phone },
        });
        if (phoneExists) throw new BadRequestException('Phone already exists');
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

  async createProduct(dto: CreateProductDto, files: Express.Multer.File[]): Promise<Object> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if(await this.sallerRepository.findOne({where: {id: dto.sallerId}}) === null) throw new NotFoundException('Saller not found');
      if (dto.stock <= 0) throw new BadRequestException('Stock must be greater than 0');
      const product = queryRunner.manager.create(Product, dto);
      await queryRunner.manager.save(product);
      if (files && files.length > 0) {
        const productImages: ProductImage[] = [];
        for (const file of files) {
          const imagePath = await this.fileService.createFile(file);
          const productImage = queryRunner.manager.create(ProductImage, { product, ImageUrl: imagePath });
          await queryRunner.manager.save(productImage);
          productImages.push(productImage);
        }
        product.images = productImages;
        await queryRunner.manager.save(product);
      }
      await queryRunner.commitTransaction();
      return {message: 'Product created successfully', productId: product.id};
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(`Error creating product: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async getProduct(id: number): Promise<Product> {
    try {
      if (isNaN(id)) throw new BadRequestException('Invalid product ID');
      const product = await this.productRepository.findOne({
        where: { id },
        relations: ['images'],
      });
      if (!product) throw new NotFoundException(`Product not found: ${id}`);
      return product;
    } catch (error) {
      throw new InternalServerErrorException(`Error fetching product: ${error.message}`);
    }
  }

  async getProducts(): Promise<Product[]> {
    try {
      const products = await this.productRepository.find({
        relations: ['images'],
      });
      if (!products || products.length === 0) {
        console.log('No products found in the database');
      }
      return products;
    } catch (error) {
      throw new InternalServerErrorException(`Error fetching products: ${error.message}`);
    }
  }

  async updateProduct(id: number, dto: UpdateDto, files: Express.Multer.File[]): Promise<Product> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if (isNaN(id)) throw new BadRequestException('Invalid product ID');
      if(dto.sallerId && !await this.sallerRepository.findOne({where: {id: dto.sallerId}})) throw new NotFoundException('Saller not found');
      if (dto.stock <= 0) throw new BadRequestException('Stock must be greater than 0');
      const product = await this.productRepository.findOne({
        where: { id },
        relations: ['images'],
      });
      if (!product) throw new NotFoundException(`Product not found: ${id}`);

      if (product.images && product.images.length > 0) {
        for (const image of product.images) {
          await this.fileService.deleteFile(image.ImageUrl);
          await queryRunner.manager.delete(ProductImage, image.id);
        }
      }

      Object.assign(product, dto);
      await queryRunner.manager.save(product);

      if (files && files.length > 0) {
        const productImages: ProductImage[] = [];
        for (const file of files) {
          const imagePath = await this.fileService.createFile(file);
          const productImage = queryRunner.manager.create(ProductImage, { product, ImageUrl: imagePath });
          await queryRunner.manager.save(productImage);
          productImages.push(productImage);
        }
        product.images = productImages;
        await queryRunner.manager.save(product);
      } else {
        product.images = [];
        await queryRunner.manager.save(product);
      }

      await queryRunner.commitTransaction();
      const updatedProduct = await this.productRepository.findOne({
        where: { id },
        relations: ['images'],
      })
      return updatedProduct;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(`Error updating product: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async deleteProduct(id: number): Promise<{ message: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if (isNaN(id)) throw new BadRequestException('Invalid product ID');
      const product = await this.productRepository.findOne({
        where: { id },
        relations: ['images'],
      });
      if (!product) throw new NotFoundException(`Product not found: ${id}`);

      // Rasmlarni o'chirish
      if (product.images && product.images.length > 0) {
        for (const image of product.images) {
          await this.fileService.deleteFile(image.ImageUrl); // Faylni serverdan o'chirish
          await queryRunner.manager.delete(ProductImage, image.id);
        }
      }

      // Mahsulotni o'chirish
      await queryRunner.manager.delete(Product, id);
      await queryRunner.commitTransaction();
      return { message: 'Product deleted successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(`Error deleting product: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }
}