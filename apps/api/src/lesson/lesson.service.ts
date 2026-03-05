import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { SystemsDatabaseService } from '@thinkbloom/data-sources';
import { UploadService } from '../upload/upload.service';
import { GeminiService } from '../gemini/gemini.service';
import { getTimestamps } from 'utils/src/date-formatter.service';
import { Request, Response } from 'express';
import { VideoProducerService } from 'message-queues/src';

@Injectable()
export class LessonService {
  private readonly logger = new Logger(LessonService.name);

  constructor(
    private prisma: SystemsDatabaseService,
    private uploadService: UploadService,
    private geminiService: GeminiService,
    private videoProducer: VideoProducerService,
  ) {}

  // ============== CREATE LESSON ==============
  async create(createLessonDto: CreateLessonDto, userId: number) {
    const course = await this.prisma.course.findUnique({
      where: { id: createLessonDto.course_id },
    });

    if (!course) throw new NotFoundException('Course not found');
    if (course.teacher_id !== userId)
      throw new ForbiddenException('Only the course teacher can create lessons');

    const lastLesson = await this.prisma.lesson.findFirst({
      where: { course_id: createLessonDto.course_id },
      orderBy: { order: 'desc' },
    });

    const order = createLessonDto.order ?? (lastLesson ? lastLesson.order + 1 : 1);
    const now = BigInt(Date.now());

    return this.prisma.lesson.create({
      data: {
        ...createLessonDto,
        order,
        created_by: userId,
        updated_by: userId,
        created_at: now,
      },
      include: {
        course: { select: { id: true, title: true, teacher_id: true } },
      },
    });
  }

  // ============== UPLOAD LESSON VIDEO ==============
  async uploadVideo(
    lessonId: number,
    file: Express.Multer.File,
    userId: number,
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          include: {
            teacher: { select: { first_name: true, email: true } },
          },
        },
      },
    });

    if (!lesson || lesson.deleted_at) throw new NotFoundException('Lesson not found');
    if (lesson.course.teacher_id !== userId)
      throw new ForbiddenException('Only the course teacher can upload videos');

    // Delete old video blob if exists
    if (lesson.video_url) {
      const oldFile = await this.prisma.importedFile.findFirst({
        where: { lesson_id: lessonId, file_type: { startsWith: 'video/' }, deleted_at: null },
        orderBy: { created_at: 'desc' },
      });

      if (oldFile) {
        await this.uploadService.deleteVideo(oldFile.blob_file_name);
        await this.prisma.importedFile.update({
          where: { id: oldFile.id },
          data: { deleted_at: BigInt(Date.now()) },
        });
      }
    }

    // Upload new video
    const { blobFileName, fileUrl, fileSize, fileType } =
      await this.uploadService.uploadVideo(file, `courses/${lesson.course_id}/lessons/${lessonId}`);

    const [importedFile] = await this.prisma.$transaction([
      this.prisma.importedFile.create({
        data: {
          user_id: userId,
          course_id: lesson.course_id,
          lesson_id: lessonId,
          original_file_name: file.originalname,
          blob_file_name: blobFileName,
          file_url: fileUrl,
          file_size: fileSize,
          file_type: fileType,
          created_by: userId,
          updated_by: userId,
          ...getTimestamps('create'),
        },
      }),
      this.prisma.lesson.update({
        where: { id: lessonId },
        data: {
          video_url: fileUrl,
          updated_by: userId,
          ...getTimestamps('update'),
        },
      }),
    ]);

    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

    // Dispatch background job for post-upload processing & teacher email notification
    this.videoProducer.dispatchVideoProcess({
      lessonId,
      lessonTitle: lesson.title,
      courseTitle: lesson.course.title,
      courseId: lesson.course_id,
      courseUuid: lesson.course.uuid,
      teacherName: lesson.course.teacher.first_name,
      teacherEmail: lesson.course.teacher.email,
      fileName: file.originalname,
      fileUrl,
      fileSize: fileSizeMB,
    }).catch((err) => this.logger.error('Failed to dispatch video process job', err));

    return {
      message: 'Video uploaded successfully',
      file: {
        uuid: importedFile.uuid,
        originalName: importedFile.original_file_name,
        fileUrl: importedFile.file_url,
        fileSize: importedFile.file_size.toString(),
        fileType: importedFile.file_type,
      },
    };
  }

  // ============== DELETE LESSON VIDEO ==============
  async deleteVideo(lessonId: number, userId: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    });

    if (!lesson || lesson.deleted_at) throw new NotFoundException('Lesson not found');
    if (lesson.course.teacher_id !== userId)
      throw new ForbiddenException('Only the course teacher can delete videos');

    if (!lesson.video_url) throw new BadRequestException('Lesson has no video to delete');

    const videoFile = await this.prisma.importedFile.findFirst({
      where: { lesson_id: lessonId, file_type: { startsWith: 'video/' }, deleted_at: null },
      orderBy: { created_at: 'desc' },
    });

    if (videoFile) {
      await this.uploadService.deleteVideo(videoFile.blob_file_name);
      await this.prisma.importedFile.update({
        where: { id: videoFile.id },
        data: { deleted_at: BigInt(Date.now()) },
      });
    }

    await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        video_url: null,
        updated_by: userId,
        ...getTimestamps('update'),
      },
    });

    return { message: 'Video deleted successfully' };
  }

  // ============== FIND ALL LESSONS ==============
  async findAll(filters?: { course_id?: number; teacher_id?: number; search?: string }) {
    const where: any = { deleted_at: null };

    if (filters?.course_id) where.course_id = filters.course_id;
    if (filters?.teacher_id) where.course = { teacher_id: filters.teacher_id };
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.lesson.findMany({
      where,
      orderBy: [{ course_id: 'asc' }, { order: 'asc' }],
      include: {
        course: {
          select: {
            id: true,
            title: true,
            teacher: { select: { id: true, first_name: true, last_name: true } },
          },
        },
        _count: { select: { files: true, progress: true } },
      },
    });
  }

  // ============== FIND BY COURSE ==============
  async findByCourse(courseId: number) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    return this.prisma.lesson.findMany({
      where: { course_id: courseId, deleted_at: null },
      orderBy: { order: 'asc' },
      include: {
        files: { where: { deleted_at: null } },
        _count: { select: { progress: true } },
      },
    });
  }

  // ============== FIND ONE ==============
  async findOne(id: number, userId?: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            teacher: { select: { id: true, first_name: true, last_name: true, email: true } },
          },
        },
        files: { where: { deleted_at: null } },
        progress: userId
          ? {
              where: { enrollment: { student_id: userId } },
              include: { enrollment: { select: { id: true, status: true } } },
            }
          : undefined,
      },
    });

    if (!lesson || lesson.deleted_at) throw new NotFoundException('Lesson not found');
    return lesson;
  }

  // ============== UPDATE LESSON ==============
  async update(id: number, updateLessonDto: UpdateLessonDto, userId: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!lesson || lesson.deleted_at) throw new NotFoundException('Lesson not found');
    if (lesson.course.teacher_id !== userId)
      throw new ForbiddenException('Only the course teacher can update lessons');

    if (updateLessonDto.order !== undefined && updateLessonDto.order !== lesson.order) {
      await this.reorderLessons(lesson.course_id, id, updateLessonDto.order);
    }

    return this.prisma.lesson.update({
      where: { id },
      data: {
        ...updateLessonDto,
        updated_by: userId,
        ...getTimestamps('update'),
      },
      include: { course: { select: { id: true, title: true } } },
    });
  }

  // ============== SOFT DELETE ==============
  async remove(id: number, userId: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!lesson || lesson.deleted_at) throw new NotFoundException('Lesson not found');
    if (lesson.course.teacher_id !== userId)
      throw new ForbiddenException('Only the course teacher can delete lessons');

    const now = BigInt(Date.now());
    return this.prisma.lesson.update({
      where: { id },
      data: { deleted_at: now, updated_by: userId, updated_at: now },
    });
  }

  // ============== REORDER LESSONS ==============
  async reorderLessons(courseId: number, lessonId: number, newOrder: number) {
    const lessons = await this.prisma.lesson.findMany({
      where: { course_id: courseId, deleted_at: null },
      orderBy: { order: 'asc' },
    });

    const currentLesson = lessons.find((l) => l.id === lessonId);
    if (!currentLesson) throw new NotFoundException('Lesson not found');

    const oldOrder = currentLesson.order;
    if (oldOrder === newOrder) return;

    await this.prisma.$transaction(async (tx) => {
      if (newOrder > oldOrder) {
        await tx.lesson.updateMany({
          where: { course_id: courseId, order: { gt: oldOrder, lte: newOrder }, deleted_at: null },
          data: { order: { decrement: 1 } },
        });
      } else {
        await tx.lesson.updateMany({
          where: { course_id: courseId, order: { gte: newOrder, lt: oldOrder }, deleted_at: null },
          data: { order: { increment: 1 } },
        });
      }
      await tx.lesson.update({ where: { id: lessonId }, data: { order: newOrder } });
    });
  }

  // ============== VIDEO STREAMING ==============
  async streamVideo(id: number, req: Request, res: Response) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson || lesson.deleted_at) throw new NotFoundException('Lesson not found');
    if (!lesson.video_url) throw new NotFoundException('This lesson has no video');

    const file = await this.prisma.importedFile.findFirst({
      where: { lesson_id: id, file_type: { startsWith: 'video/' }, deleted_at: null },
      orderBy: { created_at: 'desc' },
    });
    if (!file) throw new NotFoundException('Video file record not found');

    if (this.uploadService.isS3Mode()) {
      // Redirect to a short-lived presigned S3 URL (1 hour)
      const url = await this.uploadService.getPresignedUrl(file.blob_file_name);
      res.redirect(302, url);
      return;
    }

    const localPath = this.uploadService.resolveLocalPath(file.blob_file_name);
    this.uploadService.streamVideo(localPath, req, res);
  }

  // ============== NOTES: GENERATE & SAVE ==============
  async generateAndSaveNotes(id: number, userId: number) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson || lesson.deleted_at) throw new NotFoundException('Lesson not found');

    const content = await this.geminiService.generateLessonNotes(
      lesson.title,
      lesson.content ?? '',
      lesson.description ?? '',
    );

    const now = BigInt(Date.now());

    const note = await this.prisma.lessonNote.upsert({
      where: { lesson_id: id },
      create: {
        lesson_id: id,
        content,
        created_by: userId,
        updated_by: userId,
        created_at: now,
      },
      update: {
        content,
        updated_by: userId,
        updated_at: now,
      },
    });

    return note;
  }

  // ============== NOTES: FETCH ==============
  async getNotes(id: number) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson || lesson.deleted_at) throw new NotFoundException('Lesson not found');

    const note = await this.prisma.lessonNote.findUnique({ where: { lesson_id: id } });
    if (!note) throw new NotFoundException('Notes not yet generated for this lesson');

    return note;
  }
}