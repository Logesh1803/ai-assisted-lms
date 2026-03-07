import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SystemsDatabaseService } from '@thinkbloom/data-sources';

@Injectable()
export class DiscussionService {
  constructor(private prisma: SystemsDatabaseService) {}

  // ── THREADS ──────────────────────────────────────────────────────

  async getThreads(courseUuid: string, userId: number, page = 1, limit = 20) {
    const course = await this.prisma.course.findUnique({ where: { uuid: courseUuid } });
    if (!course) throw new NotFoundException('Course not found');

    const skip = (Number(page) - 1) * Number(limit);
    const [total, threads] = await Promise.all([
      this.prisma.discussionThread.count({ where: { course_id: course.id } }),
      this.prisma.discussionThread.findMany({
        where: { course_id: course.id },
        skip,
        take: Number(limit),
        orderBy: [{ is_pinned: 'desc' }, { created_at: 'desc' }],
        include: {
          user: { select: { first_name: true, last_name: true, role: true } },
          _count: { select: { replies: true } },
        },
      }),
    ]);

    return { page, limit, total, threads };
  }

  async getThread(threadUuid: string) {
    const thread = await this.prisma.discussionThread.findUnique({
      where: { uuid: threadUuid },
      include: {
        user: { select: { first_name: true, last_name: true, role: true } },
        replies: {
          orderBy: { created_at: 'asc' },
          include: {
            user: { select: { first_name: true, last_name: true, role: true } },
          },
        },
      },
    });
    if (!thread) throw new NotFoundException('Thread not found');
    return thread;
  }

  async createThread(
    courseUuid: string,
    userId: number,
    title: string,
    content: string,
  ) {
    const course = await this.prisma.course.findUnique({ where: { uuid: courseUuid } });
    if (!course) throw new NotFoundException('Course not found');

    return this.prisma.discussionThread.create({
      data: {
        course_id: course.id,
        user_id: userId,
        title,
        content,
        created_at: BigInt(Date.now()),
      },
      include: {
        user: { select: { first_name: true, last_name: true, role: true } },
      },
    });
  }

  async deleteThread(threadUuid: string, userId: number, userRole: string) {
    const thread = await this.prisma.discussionThread.findUnique({
      where: { uuid: threadUuid },
    });
    if (!thread) throw new NotFoundException('Thread not found');
    if (thread.user_id !== userId && userRole !== 'TEACHER' && userRole !== 'ADMIN') {
      throw new ForbiddenException('Not allowed to delete this thread');
    }
    await this.prisma.discussionThread.delete({ where: { uuid: threadUuid } });
    return { deleted: true };
  }

  async pinThread(threadUuid: string, teacherId: number) {
    const thread = await this.prisma.discussionThread.findUnique({
      where: { uuid: threadUuid },
    });
    if (!thread) throw new NotFoundException('Thread not found');

    return this.prisma.discussionThread.update({
      where: { uuid: threadUuid },
      data: { is_pinned: !thread.is_pinned, updated_at: BigInt(Date.now()) },
    });
  }

  // ── REPLIES ───────────────────────────────────────────────────────

  async createReply(threadUuid: string, userId: number, content: string) {
    const thread = await this.prisma.discussionThread.findUnique({
      where: { uuid: threadUuid },
    });
    if (!thread) throw new NotFoundException('Thread not found');

    return this.prisma.discussionReply.create({
      data: {
        thread_id: thread.id,
        user_id: userId,
        content,
        created_at: BigInt(Date.now()),
      },
      include: {
        user: { select: { first_name: true, last_name: true, role: true } },
      },
    });
  }

  async deleteReply(replyUuid: string, userId: number, userRole: string) {
    const reply = await this.prisma.discussionReply.findUnique({
      where: { uuid: replyUuid },
    });
    if (!reply) throw new NotFoundException('Reply not found');
    if (reply.user_id !== userId && userRole !== 'TEACHER' && userRole !== 'ADMIN') {
      throw new ForbiddenException('Not allowed to delete this reply');
    }
    await this.prisma.discussionReply.delete({ where: { uuid: replyUuid } });
    return { deleted: true };
  }
}
