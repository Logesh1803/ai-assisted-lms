import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SystemsDatabaseService, EnrollmentStatus } from '@thinkbloom/data-sources';
import { getTimestamps } from 'utils/src/date-formatter.service';
import { QueryEnrollmentDto } from './dto/create-enrollment.dto';
import { NotificationProducerService } from 'message-queues/src';

@Injectable()
export class EnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name);

  constructor(
    private prisma: SystemsDatabaseService,
    private notificationProducer: NotificationProducerService,
  ) {}

  // ============== ENROLL STUDENT ==============
  async enroll(studentId: number, courseUuid: string, createdBy: number) {
    const course = await this.prisma.course.findUnique({ where: { uuid: courseUuid } });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.prisma.enrollment.findUnique({
      where: { student_id_course_id: { student_id: studentId, course_id: course.id } },
    });
    if (existing) throw new ConflictException('Student already enrolled in this course');

    const enrollment = await this.prisma.enrollment.create({
      data: {
        student_id: studentId,
        course_id: course.id,
        status: EnrollmentStatus.ACTIVE,
        progress: 0,
        enrolled_at: BigInt(Date.now()),
        created_by: createdBy,
        updated_by: createdBy,
        ...getTimestamps('create'),
      },
      include: {
        course: { select: { uuid: true, title: true, thumbnail: true } },
        student: { select: { uuid: true, first_name: true, last_name: true, email: true } },
      },
    });

    // Dispatch enrollment confirmation email via queue (non-blocking)
    this.notificationProducer.dispatchEnrollmentConfirmation({
      studentName: enrollment.student.first_name,
      studentEmail: enrollment.student.email,
      courseTitle: enrollment.course.title,
      courseUuid: enrollment.course.uuid,
    }).catch((err) => this.logger.error('Failed to dispatch enrollment email', err));

    return enrollment;
  }

  // ============== GET MY ENROLLMENTS ==============
  async getStudentEnrollments(studentId: number, query: QueryEnrollmentDto) {
    const { page = 1, limit = 10, status } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { student_id: studentId };
    if (status) where.status = status;

    const [total, enrollments] = await Promise.all([
      this.prisma.enrollment.count({ where }),
      this.prisma.enrollment.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { enrolled_at: 'desc' },
        include: {
          course: { select: { uuid: true, title: true, thumbnail: true, description: true } },
        },
      }),
    ]);

    return { page, limit, total, enrollments };
  }

  // ============== GET COURSE ENROLLMENTS (teacher) ==============
  async getCourseEnrollments(courseUuid: string, query: QueryEnrollmentDto) {
    const course = await this.prisma.course.findUnique({ where: { uuid: courseUuid } });
    if (!course) throw new NotFoundException('Course not found');

    const { page = 1, limit = 10, status } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { course_id: course.id };
    if (status) where.status = status;

    const [total, enrollments] = await Promise.all([
      this.prisma.enrollment.count({ where }),
      this.prisma.enrollment.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { enrolled_at: 'desc' },
        include: {
          student: { select: { uuid: true, first_name: true, last_name: true, email: true } },
        },
      }),
    ]);

    return { page, limit, total, enrollments };
  }

  // ============== GET SINGLE ENROLLMENT ==============
  async findOne(enrollmentUuid: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { uuid: enrollmentUuid },
      include: {
        course: { select: { uuid: true, title: true, thumbnail: true } },
        student: { select: { uuid: true, first_name: true, last_name: true, email: true } },
        lesson_progress: {
          include: { lesson: { select: { id: true, title: true, order: true } } },
          orderBy: { lesson: { order: 'asc' } },
        },
      },
    });

    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }

  // ============== DROP ENROLLMENT ==============
  async drop(enrollmentUuid: string, studentId: number) {
    const enrollment = await this.prisma.enrollment.findUnique({ where: { uuid: enrollmentUuid } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.student_id !== studentId)
      throw new BadRequestException('You can only drop your own enrollment');
    if (enrollment.status === EnrollmentStatus.DROPPED)
      throw new BadRequestException('Enrollment already dropped');

    return this.prisma.enrollment.update({
      where: { uuid: enrollmentUuid },
      data: { status: EnrollmentStatus.DROPPED, updated_by: studentId, ...getTimestamps('update') },
    });
  }

  // ============== UPDATE PROGRESS (internal) ==============
  async updateProgress(enrollmentId: number, updatedBy: number) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: { include: { lessons: { where: { deleted_at: null } } } },
        lesson_progress: true,
      },
    });

    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const totalLessons = enrollment.course.lessons.length;
    if (totalLessons === 0) return enrollment;

    const completedLessons = enrollment.lesson_progress.filter((lp) => lp.is_completed).length;
    const progress = Math.round((completedLessons / totalLessons) * 100);
    const isCompleted = progress === 100;

    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        progress,
        status: isCompleted ? EnrollmentStatus.COMPLETED : EnrollmentStatus.ACTIVE,
        completed_at: isCompleted ? BigInt(Date.now()) : null,
        updated_by: updatedBy,
        ...getTimestamps('update'),
      },
    });
  }
}