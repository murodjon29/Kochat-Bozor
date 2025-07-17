import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, unlink, writeFile } from 'fs';
import { extname, join, resolve } from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileService {
  constructor(private configService: ConfigService) {}

  async createFile(file: Express.Multer.File): Promise<string> {
    const ext = extname(file.originalname);
    const fileName = `${file.originalname.split('.')[0]}_${Date.now()}${ext.toLowerCase()}`;
    const filePath = resolve(__dirname, '..', '..', '..', '..', 'images');
    if (!existsSync(filePath)) mkdirSync(filePath, { recursive: true });
    await writeFile(join(filePath, fileName), file.buffer, (err) => {
      if (err) throw err;
    });
    return `${this.configService.get<string>('BASE_API')}/${fileName}`;
  }

  async deleteFile(fileName: string): Promise<void> {
    const prefix = this.configService.get<string>('BASE_API');
    const file = fileName.replace(prefix, '');
    const filePath = resolve(__dirname, '..', '..', '..', '..', 'images', file);
    if (!existsSync(filePath))
      throw new BadRequestException(`File does not exist ${filePath}`);
    await unlink(filePath, (err) => {
      if (err) throw err;
    });
  }

  async existFile(fileName: string): Promise<boolean> {
    const file = fileName.replace(
      this.configService.get<string>('BASE_API'),
      '',
    );
    const filePath = resolve(__dirname, '..', '..', '..', '..', 'images', file);
    return existsSync(filePath);
  }
}
