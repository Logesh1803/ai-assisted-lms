import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { SystemsDatabaseService } from '@thinkbloom/data-sources';
import { GeminiService } from '../gemini/gemini.service';
import { getTimestamps } from 'utils/src/date-formatter.service';

@Injectable()
export class AiSummaryService {
  private readonly logger = new Logger(AiSummaryService.name);
  private readonly baseUrl: string;

  constructor(
    private prisma: SystemsDatabaseService,
    private geminiService: GeminiService,
    private configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('APP_BASE_URL') || 'http://localhost:8080';
  }

  /** Convert a stored video URL back to its local filesystem path. */
  private resolveVideoPath(videoUrl: string): string {
    // videoUrl looks like: "http://localhost:8080/uploads/videos/xyz.mp4"
    // Strip origin, then map "/uploads/..." → process.cwd()/uploads/...
    const pathname = videoUrl.replace(this.baseUrl, ''); // "/uploads/videos/xyz.mp4"
    const relative = pathname.startsWith('/uploads/')
      ? pathname.slice('/uploads/'.length)   // "videos/xyz.mp4"
      : pathname.replace(/^\//, '');
    return path.join(process.cwd(), 'uploads', relative);
  }

  private getMimeType(videoUrl: string): string {
    const ext = path.extname(videoUrl).toLowerCase();
    const map: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska',
      '.webm': 'video/webm',
    };
    return map[ext] ?? 'video/mp4';
  }

  // ============== GENERATE / REGENERATE SUMMARY ==============
  async generate(courseUuid: string, userId: number) {
    const course = await this.prisma.course.findUnique({
      where: { uuid: courseUuid },
      include: {
        lessons: {
          where: { deleted_at: null },
          orderBy: { order: 'asc' },
          select: { title: true, description: true, content: true, video_url: true },
        },
      },
    });

    if (!course) throw new NotFoundException('Course not found');
    if (course.lessons.length === 0)
      throw new BadRequestException('Course has no lessons to summarize');

    // Analyze videos in parallel (fire-and-forget errors — continue with text if video fails)
    const enrichedLessons = await Promise.all(
      course.lessons.map(async (lesson) => {
        const base = {
          title: lesson.title,
          description: lesson.description ?? '',
          content: lesson.content ?? '',
          videoSummary: undefined as string | undefined,
          videoKeyPoints: undefined as string[] | undefined,
        };
        if (lesson.video_url) {
          try {
            const filePath = this.resolveVideoPath(lesson.video_url);
            const mimeType = this.getMimeType(lesson.video_url);
            this.logger.log(`Analyzing video for lesson: "${lesson.title}"`);
            const analysis = await this.geminiService.analyzeVideoFile(filePath, mimeType);
            base.videoSummary = analysis.summary;
            base.videoKeyPoints = analysis.key_points;
            this.logger.log(`  ✓ Video analyzed for: "${lesson.title}"`);
          } catch (err: any) {
            this.logger.warn(`Video analysis skipped for "${lesson.title}": ${err.message}`);
          }
        }
        return base;
      }),
    );

    const { summary, key_points } = await this.geminiService.generateCourseSummary(
      course.title,
      enrichedLessons,
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