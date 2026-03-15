import { Controller, Get, Patch, Param, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InAppNotificationService } from './notification.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: InAppNotificationService) {}

  // GET /notifications — get current user's notifications
  @Get()
  getMyNotifications(@Request() req) {
    return this.notificationService.getMyNotifications(req.user.id);
  }

  // PATCH /notifications/read-all — mark all as read
  @Patch('read-all')
  markAllRead(@Request() req) {
    return this.notificationService.markAllRead(req.user.id);
  }

  // PATCH /notifications/:uuid/read — mark single as read
  @Patch(':uuid/read')
  markRead(@Param('uuid') uuid: string, @Request() req) {
    return this.notificationService.markRead(uuid, req.user.id);
  }
}
