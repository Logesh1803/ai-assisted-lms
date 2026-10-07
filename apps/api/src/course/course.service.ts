import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateCourseDto } from "./dto/create-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";
import { QueryCourseDto, QueryMyCourseDto } from "./dto/query-course.dto";
import {
  CourseStatus,
  PrismaSystemTypes,
  SystemsDatabaseService,
} from "@thinkbloom/data-sources";
import { getTimestamps } from "@thinkbloom/utils";
import { GeminiService } from "../gemini/gemini.service";

@Injectable()
export class CourseService {
  constructor(
    private prisma: SystemsDatabaseService,
    private geminiService: GeminiService,
  ) {}

  // ─── Create Course (teacher only) ─────────────────────────────────────────
  async create(dto: CreateCourseDto, userId: number) {
    const existing = await this.prisma.course.findFirst({
      where: { title: dto.title, teacher_id: userId },
    });
    if (existing)
      throw new ConflictException("You already have a course with this title");

    return this.prisma.course.create({
      data: {
        teacher_id: userId,
        title: dto.title,
        description: dto.description,
        thumbnail: dto.thumbnail,
        tags: dto.tags ?? [],
        status: CourseStatus.DRAFT,
        created_by: userId,
        updated_by: userId,
        ...getTimestamps("create"),
      },
      include: {
        teacher: { select: { uuid: true, first_name: true, last_name: true } },
        _count: { select: { lessons: true, enrollments: true } },
      },
    });
  }

  // ─── Get All Published Courses (student browse) ────────────────────────────
  async findAll(query: QueryCourseDto) {
    const { page = 1, limit = 12, search, tags } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: PrismaSystemTypes.CourseWhereInput = {
      status: CourseStatus.PUBLISHED,
      deleted_at: null,
    };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (tags) {
      where.tags = { hasSome: Array.isArray(tags) ? tags : [tags] };
    }

    const [total, courses] = await Promise.all([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { created_at: "desc" },
        select: {
          uuid: true,
          title: true,
          description: true,
          thumbnail: true,
          tags: true,
          status: true,
          created_at: true,
          teacher: {
            select: { uuid: true, first_name: true, last_name: true },
          },
          _count: { select: { lessons: true, enrollments: true } },
        },
      }),
    ]);

    return { page: Number(page), limit: Number(limit), total, courses };
  }

  // ─── Get Teacher's Own Courses ────────────────────────────────────────────
  async findMyCourses(teacherId: number, query: QueryMyCourseDto) {
    const { page = 1, limit = 12, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: PrismaSystemTypes.CourseWhereInput = {
      teacher_id: teacherId,
      deleted_at: null,
    };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, courses] = await Promise.all([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { created_at: "desc" },
        include: {
          _count: { select: { lessons: true, enrollments: true } },
        },
      }),
    ]);

    // Attach quiz attempt count per course (no direct Prisma relation, so groupBy)
    const courseIds = courses.map((course) => course.id);
    const quizCounts = courseIds.length
      ? await this.prisma.quizAttempt.groupBy({
          by: ["course_id"],
          where: { course_id: { in: courseIds }, submitted_at: { not: null } },
          _count: { id: true },
        })
      : [];
    const quizAttemptCountByCourseId = new Map(
      quizCounts.map((row) => [row.course_id, row._count.id]),
    );
    const coursesWithQuiz = courses.map((course) => ({
      ...course,
      quizAttemptCount: quizAttemptCountByCourseId.get(course.id) ?? 0,
    }));

    return {
      page: Number(page),
      limit: Number(limit),
      total,
      courses: coursesWithQuiz,
    };
  }

  // ─── Get Single Course ────────────────────────────────────────────────────
  async findOne(uuid: string, userId?: number) {
    const course = await this.prisma.course.findUnique({
      where: { uuid },
      include: {
        teacher: {
          select: {
            uuid: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        lessons: {
          where: { deleted_at: null },
          orderBy: { order: "asc" },
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

    if (!course || course.deleted_at)
      throw new NotFoundException("Course not found");

    let isEnrolled = false;
    let enrollmentUuid: string | null = null;
    let enrollmentProgress = 0;
    if (userId) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          student_id_course_id: { student_id: userId, course_id: course.id },
        },
        select: { uuid: true, progress: true },
      });
      if (enrollment) {
        isEnrolled = true;
        enrollmentUuid = enrollment.uuid;
        enrollmentProgress = enrollment.progress;
      }
    }

    return { ...course, isEnrolled, enrollmentUuid, enrollmentProgress };
  }

  // ─── Update Course ────────────────────────────────────────────────────────
  async update(uuid: string, dto: UpdateCourseDto, userId: number) {
    const course = await this.prisma.course.findUnique({ where: { uuid } });
    if (!course || course.deleted_at)
      throw new NotFoundException("Course not found");
    if (course.teacher_id !== userId)
      throw new ForbiddenException("Only the course teacher can update it");

    return this.prisma.course.update({
      where: { uuid },
      data: { ...dto, updated_by: userId, ...getTimestamps("update") },
    });
  }

  // ─── Publish / Archive ────────────────────────────────────────────────────
  async changeStatus(uuid: string, status: CourseStatus, userId: number) {
    const course = await this.prisma.course.findUnique({ where: { uuid } });
    if (!course || course.deleted_at)
      throw new NotFoundException("Course not found");
    if (course.teacher_id !== userId)
      throw new ForbiddenException("Only the course teacher can change status");

    return this.prisma.course.update({
      where: { uuid },
      data: { status, updated_by: userId, ...getTimestamps("update") },
    });
  }

  // ─── AI: Generate Course from Prompt ─────────────────────────────────────
  async generateFromPrompt(
    prompt: string,
    userId: number,
    syllabus?: string[],
  ) {
    const generated = await this.geminiService.generateCourseFromPrompt(
      prompt,
      syllabus,
    );

    const now = BigInt(Date.now());

    const existing = await this.prisma.course.findFirst({
      where: { title: generated.title, teacher_id: userId },
    });
    const title = existing ? `${generated.title} (2)` : generated.title;

    // Generate a deterministic thumbnail using the course title as seed
    const seed = encodeURIComponent(title.replace(/\s+/g, "-").toLowerCase());
    const thumbnail = `https://picsum.photos/seed/${seed}/800/450`;

    const course = await this.prisma.course.create({
      data: {
        teacher_id: userId,
        title,
        description: generated.description,
        thumbnail,
        tags: generated.tags ?? [],
        status: CourseStatus.DRAFT,
        created_by: userId,
        updated_by: userId,
        ...getTimestamps("create"),
      },
    });

    if (generated.lessons?.length) {
      await this.prisma.lesson.createMany({
        data: generated.lessons.map((lesson) => ({
          course_id: course.id,
          title: lesson.title,
          description: lesson.description,
          content: lesson.content,
          order: lesson.order,
          created_by: userId,
          updated_by: userId,
          created_at: now,
        })),
      });
    }

    return this.prisma.course.findUnique({
      where: { id: course.id },
      include: {
        teacher: { select: { uuid: true, first_name: true, last_name: true } },
        lessons: { where: { deleted_at: null }, orderBy: { order: "asc" } },
        _count: { select: { lessons: true, enrollments: true } },
      },
    });
  }

  // ─── Soft Delete ──────────────────────────────────────────────────────────
  async remove(uuid: string, userId: number) {
    const course = await this.prisma.course.findUnique({ where: { uuid } });
    if (!course || course.deleted_at)
      throw new NotFoundException("Course not found");
    if (course.teacher_id !== userId)
      throw new ForbiddenException("Only the course teacher can delete it");

    return this.prisma.course.update({
      where: { uuid },
      data: { deleted_at: BigInt(Date.now()), updated_by: userId },
    });
  }

  // ─── Student Performance (teacher view) ──────────────────────────────────
  async getStudentPerformance(courseUuid: string, teacherId: number) {
    const course = await this.prisma.course.findUnique({
      where: { uuid: courseUuid },
    });
    if (!course) throw new NotFoundException("Course not found");
    if (course.teacher_id !== teacherId)
      throw new ForbiddenException("Access denied");

    const enrollments = await this.prisma.enrollment.findMany({
      where: { course_id: course.id },
      select: {
        status: true,
        progress: true,
        enrolled_at: true,
        completed_at: true,
        student: {
          select: {
            uuid: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        // Ask for the completed count directly. The previous version joined
        // every progress row together with its lesson title just to run
        // .filter().length over them in memory.
        _count: {
          select: {
            lesson_progress: {
              where: { is_completed: true, lesson: { deleted_at: null } },
            },
          },
        },
        quiz_attempts: {
          select: { score: true, total_questions: true, submitted_at: true },
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
      orderBy: { enrolled_at: "desc" },
    });

    return enrollments.map((enrollment) => ({
      student: enrollment.student,
      status: enrollment.status,
      progress: enrollment.progress,
      enrolledAt: enrollment.enrolled_at,
      completedAt: enrollment.completed_at,
      latestQuizScore: enrollment.quiz_attempts[0]?.score ?? null,
      lessonsCompleted: enrollment._count.lesson_progress,
    }));
  }
}
