import { Injectable, NotFoundException } from '@nestjs/common';
import { SystemsDatabaseService } from '@thinkbloom/data-sources';
import { GeminiService } from '../gemini/gemini.service';
import { SendMessageDto, ExplainConceptDto } from './dto/chatbot.dto';

@Injectable()
export class ChatbotService {
  constructor(
    private prisma: SystemsDatabaseService,
    private geminiService: GeminiService,
  ) {}

  // ─── Send Message ─────────────────────────────────────────────────────────

  async sendMessage(userId: number, dto: SendMessageDto) {
    let session: any;

    if (dto.sessionUuid) {
      session = await this.prisma.chatSession.findUnique({
        where: { uuid: dto.sessionUuid },
        include: { messages: { orderBy: { created_at: 'asc' } } },
      });
      if (!session || session.user_id !== userId) {
        throw new NotFoundException('Chat session not found');
      }
    } else {
      // Create a new session with auto-title from first message
      const title =
        dto.message.length > 50
          ? dto.message.substring(0, 50) + '...'
          : dto.message;

      session = await this.prisma.chatSession.create({
        data: {
          user_id: userId,
          course_id: dto.courseId ?? null,
          title,
          created_at: BigInt(Date.now()),
        },
        include: { messages: true },
      });
    }

    // Build history for context
    const history = (session.messages || []).map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    // Get course context if courseId provided
    let courseTitle: string | undefined;
    if (session.course_id) {
      const course = await this.prisma.course.findUnique({
        where: { id: session.course_id },
        select: { title: true },
      });
      courseTitle = course?.title;
    } else if (dto.courseContext) {
      courseTitle = dto.courseContext;
    }

    // Get AI response
    const aiResponse = await this.geminiService.chat(
      dto.message,
      history,
      courseTitle,
    );

    const now = BigInt(Date.now());

    // Save user message and AI response
    await this.prisma.chatMessage.createMany({
      data: [
        {
          session_id: session.id,
          role: 'user',
          content: dto.message,
          created_at: now,
        },
        {
          session_id: session.id,
          role: 'assistant',
          content: aiResponse,
          created_at: now + BigInt(1),
        },
      ],
    });

    // Update session timestamp
    await this.prisma.chatSession.update({
      where: { id: session.id },
      data: { updated_at: now },
    });

    return {
      sessionUuid: session.uuid,
      message: aiResponse,
    };
  }

  // ─── Get Sessions ─────────────────────────────────────────────────────────

  async getSessions(userId: number) {
    return this.prisma.chatSession.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      select: {
        uuid: true,
        title: true,
        course_id: true,
        created_at: true,
        updated_at: true,
        _count: { select: { messages: true } },
      },
    });
  }

  // ─── Get Session History ──────────────────────────────────────────────────

  async getSession(sessionUuid: string, userId: number) {
    const session = await this.prisma.chatSession.findUnique({
      where: { uuid: sessionUuid },
      include: {
        messages: { orderBy: { created_at: 'asc' } },
      },
    });

    if (!session || session.user_id !== userId) {
      throw new NotFoundException('Chat session not found');
    }

    return session;
  }

  // ─── Delete Session ───────────────────────────────────────────────────────

  async deleteSession(sessionUuid: string, userId: number) {
    const session = await this.prisma.chatSession.findUnique({
      where: { uuid: sessionUuid },
    });
    if (!session || session.user_id !== userId) {
      throw new NotFoundException('Chat session not found');
    }
    await this.prisma.chatSession.delete({ where: { uuid: sessionUuid } });
    return { message: 'Session deleted' };
  }

  // ─── Explain Concept (multi-subject) ────────────────────────────────────

  async explainConcept(dto: ExplainConceptDto) {
    return this.geminiService.explainConcept(dto.term, dto.subjects);
  }
}
