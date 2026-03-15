import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { InAppNotificationService } from './notification.service';

@Module({
  controllers: [NotificationController],
  providers: [InAppNotificationService],
  exports: [InAppNotificationService],
})
export class InAppNotificationModule {}
