import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SystemsDatabaseService } from '@thinkbloom/data-sources';
import { NotificationType } from '@thinkbloom/data-sources';

@Injectable()
export class InAppNotificationService {
  constructor(private prisma: SystemsDatabaseService) {}

  // ─── Get user notifications ───────────────────────────────────────────────

  async getMyNotifications(userId: number) {
    const [notifications, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: 50,
      }),
      this.prisma.notification.count({
        where: { user_id: userId, is_read: false },
      }),
    ]);
    return { notifications, unreadCount };
  }

  // ─── Mark single notification as read ────────────────────────────────────

  async markRead(uuid: string, userId: number) {
    const notif = await this.prisma.notification.findUnique({ where: { uuid } });
    if (!notif) throw new NotFoundException('Notification not found');
    if (notif.user_id !== userId) throw new ForbiddenException();

    return this.prisma.notification.update({
      where: { uuid },
      data: { is_read: true, read_at: BigInt(Date.now()) },
    });
  }

  // ─── Mark all notifications as read ──────────────────────────────────────

  async markAllRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true, read_at: BigInt(Date.now()) },
    });
    return { message: 'All notifications marked as read' };
  }

  // ─── Create notification (called internally) ──────────────────────────────

  async create(data: {
    userId: number;
    title: string;
    message: string;
    type: NotificationType;
    actionUrl?: string;
    extra?: Record<string, any>;
  }) {
    return this.prisma.notification.create({
      data: {
        user_id: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        data: data.extra ? { actionUrl: data.actionUrl, ...data.extra } : { actionUrl: data.actionUrl },
        created_at: BigInt(Date.now()),
      },
    });
  }
}
