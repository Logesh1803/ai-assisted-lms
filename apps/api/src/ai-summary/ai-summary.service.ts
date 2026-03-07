import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SystemsDatabaseService } from '@thinkbloom/data-sources';
import { GeminiService } from '../gemini/gemini.service';
import { getTimestamps } from 'utils/src/date-formatter.service';

@Injectable()
export class AiSummaryService {
  constructor(
    private prisma: SystemsDatabaseService,
    private geminiService: GeminiService,
  ) {}

  // ============== GENERATE / REGENERATE SUMMARY ==============
  async generate(courseUuid: string, userId: number) {
    const course = await this.prisma.course.findUnique({
      where: { uuid: courseUuid },
      include: {
        lessons: {
          where: { deleted_at: null },
          orderBy: { order: 'asc' },
          select: { title: true, description: true, content: true },
        },
      },
    });

    const normalizedLessons = course?.lessons.map(lesson => ({
      title: lesson.title,
      description: lesson.description ?? '',
      content: lesson.content ?? '',
    })) ?? [];

    if (!course) throw new NotFoundException('Course not found');
    if (course.lessons.length === 0)
      throw new BadRequestException('Course has no lessons to summarize');

    const { summary, key_points } = await this.geminiService.generateCourseSummary(
      course.title,
      normalizedLessons,
    );

    return this.prisma.aISummary.upsert({
      where: { course_id: course.id },
      create: {
        course_id: course.id,
        summary,
        key_points,
        created_by: userId,
        updated_by: userId,
        ...getTimestamps('create'),
      },
      update: {
        summary,
        key_points,
        updated_by: userId,
        ...getTimestamps('update'),
      },
    });
  }

  // ============== GET SUMMARY BY COURSE ==============
  async getByCourse(courseUuid: string) {
    const course = await this.prisma.course.findUnique({ where: { uuid: courseUuid } });
    if (!course) throw new NotFoundException('Course not found');

    const summary = await this.prisma.aISummary.findUnique({ where: { course_id: course.id } });
    if (!summary)
      throw new NotFoundException('No summary found. Generate one first.');

    return summary;
  }

  // ============== GENERATE STUDENT NOTES FROM SUMMARY ==============
  async generateStudentNotes(courseUuid: string): Promise<{ notes: string }> {
    const course = await this.prisma.course.findUnique({ where: { uuid: courseUuid } });
    if (!course) throw new NotFoundException('Course not found');

    const summary = await this.prisma.aISummary.findUnique({ where: { course_id: course.id } });
    if (!summary) throw new NotFoundException('No summary found. Generate a course summary first.');

    const notes = await this.geminiService.generateStudentNotesFromSummary(
      course.title,
      summary.summary,
      (summary.key_points as string[]) ?? [],
    );

    return { notes };
  }

  // ============== DELETE SUMMARY ==============
  async delete(courseUuid: string) {
    const course = await this.prisma.course.findUnique({ where: { uuid: courseUuid } });
    if (!course) throw new NotFoundException('Course not found');

    const summary = await this.prisma.aISummary.findUnique({ where: { course_id: course.id } });
    if (!summary) throw new NotFoundException('No summary found for this course');

    await this.prisma.aISummary.delete({ where: { course_id: course.id } });
    return { message: 'Summary deleted successfully' };
  }
}