import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class EmailService {
  private transporter;

  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.transporter = createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: +this.configService.get<number>('PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  async sendEmail(dto: { recipients: string[]; subject: string; html: string }) {
    const { recipients, subject, html } = dto;
    const cacheKey = `email-sent-${recipients.join('-')}-${Date.now()}`;    
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_USER'),
        to: recipients,
        subject,
        html,
      });
      await this.cacheManager.set(cacheKey, 'success', 3600); // 1 soat uchun keshga saqlash
      console.log(`Email sent and cached with key: ${cacheKey}`);
    } catch (error) {
      throw new BadRequestException(`Email sending failed: ${error.message}`);
    }
  }
}