import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseStatus, SystemsDatabaseService } from '@thinkbloom/data-sources';
import { getTimestamps } from 'utils/src/date-formatter.service';

@Injectable()
export class CourseService {
  constructor(private db: SystemsDatabaseService) {}

  // ─── Create Course (teacher only) ─────────────────────────────────────────
  async create(dto: CreateCourseDto, userId: number) {
    const existing = await this.db.course.findFirst({
      where: { title: dto.title, teacher_id: userId },
    });
    if (existing) throw new ConflictException('You already have a course with this title');

    return this.db.course.create({
      data: {
        teacher_id: userId,
        title: dto.title,
        description: dto.description,
        thumbnail: dto.thumbnail,
        tags: dto.tags ?? [],
        status: CourseStatus.DRAFT,
        created_by: userId,
        updated_by: userId,
        ...getTimestamps('create'),
      },
      include: {
        teacher: { select: { uuid: true, first_name: true, last_name: true } },
        _count: { select: { lessons: true, enrollments: true } },
      },
    });
  }

  // ─── Get All Published Courses (student browse) ────────────────────────────
  async findAll(query: any) {
    const { page = 1, limit = 12, search, tags } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { status: CourseStatus.PUBLISHED, deleted_at: null };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (tags) {
      where.tags = { hasSome: Array.isArray(tags) ? tags : [tags] };
    }

    const [total, courses] = await Promise.all([
      this.db.course.count({ where }),
      this.db.course.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { created_at: 'desc' },
        select: {
          uuid: true,
          title: true,
          description: true,
          thumbnail: true,
          tags: true,
          status: true,
          created_at: true,
          teacher: { select: { uuid: true, first_name: true, last_name: true } },
          _count: { select: { lessons: true, enrollments: true } },
        },
      }),
    ]);

    return { page: Number(page), limit: Number(limit), total, courses };
  }

  // ─── Get Teacher's Own Courses ────────────────────────────────────────────
  async findMyCourses(teacherId: number, query: any) {
    const { page = 1, limit = 12, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { teacher_id: teacherId, deleted_at: null };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, courses] = await Promise.all([
      this.db.course.count({ where }),
      this.db.course.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { created_at: 'desc' },
        include: {
          _count: { select: { lessons: true, enrollments: true } },
        },
      }),
    ]);

    return { page: Number(page), limit: Number(limit), total, courses };
  }

  // ─── Get Single Course ────────────────────────────────────────────────────
  async findOne(uuid: string, userId?: number) {
    const course = await this.db.course.findUnique({
      where: { uuid },
      include: {
        teacher: { select: { uuid: true, first_name: true, last_name: true, email: true } },
        lessons: {
          where: { deleted_at: null },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            uuid: true,
            title: true,
            description: true,
            order: true,
            duration: true,
            video_url: true,
          },
        },
        summaries: {
          select: { summary: true, key_points: true, updated_at: true },
        },
        _count: { select: { enrollments: true, lessons: true } },
      },
    });

    if (!course || course.deleted_at) throw new NotFoundException('Course not found');

    let isEnrolled = false;
    let enrollmentUuid: string | null = null;
    if (userId) {
      const enrollment = await this.db.enrollment.findUnique({
        where: { student_id_course_id: { student_id: userId, course_id: course.id } },
        select: { uuid: true },
      });
      if (enrollment) {
        isEnrolled = true;
        enrollmentUuid = enrollment.uuid;
      }
    }

    return { ...course, isEnrolled, enrollmentUuid };
  }

  // ─── Update Course ────────────────────────────────────────────────────────
  async update(uuid: string, dto: UpdateCourseDto, userId: number) {
    const course = await this.db.course.findUnique({ where: { uuid } });
    if (!course || course.deleted_at) throw new NotFoundException('Course not found');
    if (course.teacher_id !== userId) throw new ForbiddenException('Only the course teacher can update it');

    return this.db.course.update({
      where: { uuid },
      data: { ...dto, updated_by: userId, ...getTimestamps('update') },
    });
  }

  // ─── Publish / Archive ────────────────────────────────────────────────────
  async changeStatus(uuid: string, status: CourseStatus, userId: number) {
    const course = await this.db.course.findUnique({ where: { uuid } });
    if (!course || course.deleted_at) throw new NotFoundException('Course not found');
    if (course.teacher_id !== userId) throw new ForbiddenException('Only the course teacher can change status');

    return this.db.course.update({
      where: { uuid },
      data: { status, updated_by: userId, ...getTimestamps('update') },
    });
  }

  // ─── Soft Delete ──────────────────────────────────────────────────────────
  async remove(uuid: string, userId: number) {
    const course = await this.db.course.findUnique({ where: { uuid } });
    if (!course || course.deleted_at) throw new NotFoundException('Course not found');
    if (course.teacher_id !== userId) throw new ForbiddenException('Only the course teacher can delete it');

    return this.db.course.update({
      where: { uuid },
      data: { deleted_at: BigInt(Date.now()), updated_by: userId },
    });
  }

  // ─── Student Performance (teacher view) ──────────────────────────────────
  async getStudentPerformance(courseUuid: string, teacherId: number) {
    const course = await this.db.course.findUnique({ where: { uuid: courseUuid } });
    if (!course) throw new NotFoundException('Course not found');
    if (course.teacher_id !== teacherId) throw new ForbiddenException('Access denied');

    const enrollments = await this.db.enrollment.findMany({
      where: { course_id: course.id },
      include: {
        student: { select: { uuid: true, first_name: true, last_name: true, email: true } },
        lesson_progress: { include: { lesson: { select: { title: true, order: true } } } },
        quiz_attempts: {
          select: { score: true, total_questions: true, submitted_at: true },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
      orderBy: { enrolled_at: 'desc' },
    });

    return enrollments.map((e) => ({
      student: e.student,
      status: e.status,
      progress: e.progress,
      enrolledAt: e.enrolled_at,
      completedAt: e.completed_at,
      latestQuizScore: e.quiz_attempts[0]?.score ?? null,
      lessonsCompleted: e.lesson_progress.filter((lp) => lp.is_completed).length,
    }));
  }
}
