import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { SystemsDatabaseModule } from '@thinkbloom/data-sources';
import { ConfigModule } from '@nestjs/config';
import { getEnvFilePath } from '@thinkbloom/utils';
import { UserModule } from './user/user.module';
import { BULL_QUEUES, BullMQModule } from 'message-queues/src';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@/common/guard/jwt-auth.guard';
import { CourseModule } from './course/course.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { AiSummaryModule } from './ai-summary/ai-summary.module';
import { QuizModule } from './quiz/quiz.module';
import { LessonModule } from './lesson/lesson.module';
import { UploadModule } from './upload/upload.module';
import { GeminiModule } from './gemini/gemini.module';
import { LessonProgressModule } from './lesson-progress/lesson-progress.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { DiscussionModule } from './discussion/discussion.module';
import { CourseNoteModule } from './course-note/course-note.module';
import { InAppNotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: getEnvFilePath(),
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    BullMQModule.register({
      queues: [BULL_QUEUES.NOTIFICATIONS],
      enableBullBoard: true,
    }),
    AuthModule,
    SystemsDatabaseModule,
    UserModule,
    CourseModule,
    EnrollmentModule,
    AiSummaryModule,
    QuizModule,
    LessonModule,
    UploadModule,
    GeminiModule,
    LessonProgressModule,
    ChatbotModule,
    DiscussionModule,
    CourseNoteModule,
    InAppNotificationModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
