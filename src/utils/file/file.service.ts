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

      const baseUrl = this.configService.get<string>('KOCHAT_API') || 'http://34.229.90.146:3000';
      const imageUrl = `${baseUrl}/images/${fileName}`;
      console.log('Generated Image URL:', imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('Error creating file:', error.message);
      throw new BadRequestException(`Error on creating file: ${error.message}`);
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      if (!fileUrl) {
        console.warn('No file URL provided for deletion');
        return;
      }
      const baseUrl = this.configService.get<string>('KOCHAT_API') || 'http://34.229.90.146:3000';
      console.log('Deleting file with URL:', fileUrl);

      // Fayl nomini to'g'ri ajratish
      const fileNameMatch = fileUrl.match(/\/images\/(.+)$/);
      if (!fileNameMatch) {
        console.warn('Invalid file URL, cannot extract file name:', fileUrl);
        return;
      }
      const fileName = fileNameMatch[1];
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
      console.log(`File deleted: ${filePath}`);
    } catch (error) {
      console.error(`Error deleting file: ${error.message}`);
    }
  }

  async existsFile(fileUrl: string): Promise<boolean> {
    try {
      if (!fileUrl) {
        console.warn('No file URL provided for existence check');
        return false;
      }
      const baseUrl = this.configService.get<string>('KOCHAT_API') || 'http://34.229.90.146:3000';
      console.log('Checking file existence for URL:', fileUrl);

      // Fayl nomini to'g'ri ajratish
      const fileNameMatch = fileUrl.match(/\/images\/(.+)$/);
      if (!fileNameMatch) {
        console.warn('Invalid file URL, cannot extract file name:', fileUrl);
        return false;
      }
      const fileName = fileNameMatch[1];
      const filePath = join(process.cwd(), 'images', fileName);
      const exists = existsSync(filePath);
      console.log(`File existence check: ${filePath} -> ${exists}`);
      return exists;
    } catch (error) {
      console.error(`Error checking file existence: ${error.message}`);
      return false;
    }
  }
}