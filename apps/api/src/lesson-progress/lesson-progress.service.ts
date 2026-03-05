import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SystemsDatabaseService } from '@thinkbloom/data-sources';
import { getTimestamps } from 'utils/src/date-formatter.service';
import { UpdateWatchTimeDto } from './dto/lesson-progress.dto';
import { EnrollmentService } from '../enrollment/enrollment.service';

@Injectable()
export class LessonProgressService {
  constructor(
    private prisma: SystemsDatabaseService,
    private enrollmentService: EnrollmentService,
  ) {}

  // ============== MARK LESSON COMPLETE ==============
  async markComplete(lessonId: number, studentId: number) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { student_id: studentId, course: { lessons: { some: { id: lessonId } } } },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found for this lesson');

    const now = BigInt(Date.now());

    const progress = await this.prisma.lessonProgress.upsert({
      where: { enrollment_id_lesson_id: { enrollment_id: enrollment.id, lesson_id: lessonId } },
      create: {
        enrollment_id: enrollment.id,
        lesson_id: lessonId,
        is_completed: true,
        completed_at: now,
        watch_time: 0,
        created_by: studentId,
        updated_by: studentId,
        ...getTimestamps('create'),
      },
      update: {
        is_completed: true,
        completed_at: now,
        updated_by: studentId,
        ...getTimestamps('update'),
      },
    });

    // Recalculate overall enrollment progress
    await this.enrollmentService.updateProgress(enrollment.id, studentId);

    return progress;
  }

  // ============== UPDATE WATCH TIME ==============
  async updateWatchTime(lessonId: number, studentId: number, dto: UpdateWatchTimeDto) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { student_id: studentId, course: { lessons: { some: { id: lessonId } } } },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found for this lesson');

    return this.prisma.lessonProgress.upsert({
      where: { enrollment_id_lesson_id: { enrollment_id: enrollment.id, lesson_id: lessonId } },
      create: {
        enrollment_id: enrollment.id,
        lesson_id: lessonId,
        is_completed: false,
        watch_time: dto.watchTime,
        created_by: studentId,
        updated_by: studentId,
        ...getTimestamps('create'),
      },
      update: {
        watch_time: dto.watchTime,
        updated_by: studentId,
        ...getTimestamps('update'),
      },
    });
  }

  // ============== GET PROGRESS BY ENROLLMENT ==============
  async getByEnrollment(enrollmentUuid: string) {
    const enrollment = await this.prisma.enrollment.findUnique({ where: { uuid: enrollmentUuid } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    return this.prisma.lessonProgress.findMany({
      where: { enrollment_id: enrollment.id },
      include: { lesson: { select: { id: true, title: true, order: true, duration: true } } },
      orderBy: { lesson: { order: 'asc' } },
    });
  }

  // ============== GET SINGLE LESSON PROGRESS ==============
  async getOne(lessonId: number, studentId: number) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { student_id: studentId, course: { lessons: { some: { id: lessonId } } } },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const progress = await this.prisma.lessonProgress.findUnique({
      where: { enrollment_id_lesson_id: { enrollment_id: enrollment.id, lesson_id: lessonId } },
    });

    return progress ?? { lesson_id: lessonId, is_completed: false, watch_time: 0 };
  }
}