import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, unlink, writeFile } from 'fs';
import { extname, join, resolve } from 'path';
import { ConfigService } from '@nestjs/config';
import { promisify } from 'util';

const writeFileAsync = promisify(writeFile);
const unlinkAsync = promisify(unlink);

@Injectable()
export class FileService {
  constructor(private configService: ConfigService) {}

  async createFiles(files: Express.Multer.File[]): Promise<string[]> {
    if (!files || files.length === 0) {
      return [];
    }

    const filePaths: string[] = [];
    const uploadDir = resolve(__dirname, '..', '..', '..', '..', 'uploads', 'products');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    for (const file of files) {
      const ext = extname(file.originalname).toLowerCase();
      if (!ext.match(/\.(jpg|jpeg|png)$/)) {
        throw new BadRequestException('Faqat JPG yoki PNG rasmlar qabul qilinadi');
      }

      const fileName = `${file.originalname.split('.')[0]}_${Date.now()}${ext}`;
      const filePath = join(uploadDir, fileName);

      try {
        await writeFileAsync(filePath, file.buffer);
        filePaths.push(`${this.configService.get<string>('BASE_API')}/products/${fileName}`);
      } catch (error) {
        throw new BadRequestException(`Rasmni saqlashda xato: ${error.message}`);
      }
    }

    return filePaths;
  }

  async deleteFile(fileName: string): Promise<void> {
    const prefix = this.configService.get<string>('BASE_API');
    const file = fileName.replace(`${prefix}/products/`, '');
    const filePath = resolve(__dirname, '..', '..', '..', '..', 'uploads', 'products', file);

    if (!existsSync(filePath)) {
      throw new BadRequestException(`Fayl topilmadi: ${filePath}`);
    }

    try {
      await unlinkAsync(filePath);
    } catch (error) {
      throw new BadRequestException(`Faylni o'chirishda xato: ${error.message}`);
    }
  }

  async existFile(fileName: string): Promise<boolean> {
    const prefix = this.configService.get<string>('BASE_API');
    const file = fileName.replace(`${prefix}/products/`, '');
    const filePath = resolve(__dirname, '..', '..', '..', '..', 'uploads', 'products', file);
    return existsSync(filePath);
  }
}