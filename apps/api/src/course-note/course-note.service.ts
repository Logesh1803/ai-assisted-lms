import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { SystemsDatabaseService } from '@thinkbloom/data-sources';
import { getTimestamps } from 'utils/src/date-formatter.service';
import { UploadService } from '../upload/upload.service';
import { NotificationProducerService } from 'message-queues/src';
import { CreateCourseNoteDto } from './dto/course-note.dto';

@Injectable()
export class CourseNoteService {
  private readonly logger = new Logger(CourseNoteService.name);

  constructor(
    private prisma: SystemsDatabaseService,
    private uploadService: UploadService,
    private notificationProducer: NotificationProducerService,
  ) {}

  // ─── Upload a note/file to a course ──────────────────────────────────────

  async upload(
    courseUuid: string,
    teacherId: number,
    dto: CreateCourseNoteDto,
    file?: Express.Multer.File,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { uuid: courseUuid },
    });
    if (!course || course.deleted_at) throw new NotFoundException('Course not found');
    if (course.teacher_id !== teacherId)
      throw new ForbiddenException('Only the course teacher can upload notes');

    let fileUrl: string | undefined;
    let fileName: string | undefined;
    let blobFileName: string | undefined;
    let fileSize: bigint | undefined;
    let fileType: string | undefined;

    if (file) {
      const uploaded = await this.uploadService.uploadDocument(file, 'course-notes');
      fileUrl = uploaded.fileUrl;
      fileName = uploaded.originalName;
      blobFileName = uploaded.blobFileName;
      fileSize = uploaded.fileSize;
      fileType = uploaded.fileType;
    }

    const note = await this.prisma.courseNote.create({
      data: {
        course_id: course.id,
        title: dto.title,
        description: dto.description,
        file_url: fileUrl,
        file_name: fileName,
        blob_file_name: blobFileName,
        file_size: fileSize,
        file_type: fileType,
        created_by: teacherId,
        updated_by: teacherId,
        ...getTimestamps('create'),
      },
    });

    // Notify all enrolled students asynchronously
    this.notifyEnrolledStudents(course.id, course.uuid, course.title, dto.title).catch(
      (err) => this.logger.error('Failed to notify students about course note', err),
    );

    return note;
  }

  private async notifyEnrolledStudents(
    courseId: number,
    courseUuid: string,
    courseTitle: string,
    noteTitle: string,
  ) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { course_id: courseId, status: 'ACTIVE' },
      include: { student: { select: { id: true, first_name: true, email: true } } },
    });

    // Create in-app notifications for each enrolled student
    const now = BigInt(Date.now());
    if (enrollments.length > 0) {
      await this.prisma.notification.createMany({
        data: enrollments.map((e) => ({
          user_id: e.student_id,
          title: 'New Resource Added',
          message: `Your teacher uploaded "${noteTitle}" in ${courseTitle}`,
          type: 'COURSE_NOTE_UPLOADED' as any,
          data: { courseUuid, noteTitle },
          created_at: now,
        })),
      });
    }

    // Send email to each enrolled student
    for (const enrollment of enrollments) {
      await this.notificationProducer
        .dispatchCourseNoteUploaded({
          studentName: enrollment.student.first_name,
          studentEmail: enrollment.student.email,
          courseTitle,
          courseUuid,
          noteTitle,
        })
        .catch((err) => this.logger.error(`Failed email for student ${enrollment.student.email}`, err));
    }
  }

  // ─── List notes for a course ──────────────────────────────────────────────

  async findByCourse(courseUuid: string) {
    const course = await this.prisma.course.findUnique({ where: { uuid: courseUuid } });
    if (!course) throw new NotFoundException('Course not found');

    return this.prisma.courseNote.findMany({
      where: { course_id: course.id, deleted_at: null },
      orderBy: { created_at: 'desc' },
    });
  }

  // ─── Delete a note ────────────────────────────────────────────────────────

  async remove(noteUuid: string, teacherId: number) {
    const note = await this.prisma.courseNote.findUnique({ where: { uuid: noteUuid } });
    if (!note || note.deleted_at) throw new NotFoundException('Note not found');

    const course = await this.prisma.course.findUnique({ where: { id: note.course_id } });
    if (course?.teacher_id !== teacherId)
      throw new ForbiddenException('Only the course teacher can delete notes');

    // Delete physical file if stored locally
    if (note.blob_file_name) {
      await this.uploadService.deleteVideo(note.blob_file_name).catch(() => {});
    }

    await this.prisma.courseNote.update({
      where: { uuid: noteUuid },
      data: { deleted_at: BigInt(Date.now()), updated_by: teacherId },
    });

    return { message: 'Note deleted successfully' };
  }
}
