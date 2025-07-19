import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, unlink, writeFile } from 'fs';
import { extname, join } from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileService {
  constructor(private readonly configService: ConfigService) {}

  async createFile(file: Express.Multer.File): Promise<string> {
    try {
      const ext = extname(file.originalname);
      const fileName = `${file.originalname.split('.')[0].replace(/\s+/g, '')}__${Date.now()}${ext.toLowerCase()}`;
      const filePath = join(process.cwd(), 'images');

      if (!existsSync(filePath)) {
        mkdirSync(filePath, { recursive: true });
      }

      await new Promise<void>((resolve, reject) => {
        writeFile(join(filePath, fileName), file.buffer, (err) => {
          if (err) reject(err);
          resolve();
        });
      });

      const baseUrl = this.configService.get<string>('KOCHAT_API')// || 'http://34.229.90.146:3000';
      return `${baseUrl}/images/${fileName}`;
    } catch (error) {
      throw new BadRequestException(`Error on creating file: ${error.message}`);
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const baseUrl = this.configService.get<string>('KOCHAT_API') // || 'http://34.229.90.146:3000';
      const fileName = fileUrl.replace(`${baseUrl}/images/`, '');
      const filePath = join(process.cwd(), 'images', fileName);

      if (!existsSync(filePath)) {
        console.warn(`File does not exist: ${filePath}`);
        return;
      }

      await new Promise<void>((resolve, reject) => {
        unlink(filePath, (err) => {
          if (err) reject(err);
          resolve();
        });
      });
    } catch (error) {
      console.error(`Error deleting file: ${error.message}`);
    }
  }

  async existsFile(fileUrl: string): Promise<boolean> {
    try {
      const baseUrl = this.configService.get<string>('KOCHAT_API') // || 'http://34.229.90.146:3000';
      const fileName = fileUrl.replace(`${baseUrl}/images/`, '');
      const filePath = join(process.cwd(), 'images', fileName);
      return existsSync(filePath);
    } catch (error) {
      console.error(`Error checking file existence: ${error.message}`);
      return false;
    }
  }
}