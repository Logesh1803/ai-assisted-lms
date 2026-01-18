import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { EmailChannel } from './channel/email.channel';

@Module({
  providers: [NotificationService,EmailChannel],
  exports: [NotificationService],
})
export class NotificationModule {}

