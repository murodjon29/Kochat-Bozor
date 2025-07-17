import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [CacheModule.register()],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
