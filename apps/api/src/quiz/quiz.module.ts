import { Module } from '@nestjs/common';
import { QuizAttemptService } from './quiz.service';
import { QuizAttemptController } from './quiz.controller';
import { GeminiModule } from '../gemini/gemini.module';
import { InAppNotificationModule } from '../notification/notification.module';
import { BullMQModule, BULL_QUEUES } from 'message-queues/src';

@Module({
  imports: [
    GeminiModule,
    InAppNotificationModule,
    BullMQModule.register({ queues: [BULL_QUEUES.NOTIFICATIONS] }),
  ],
  controllers: [QuizAttemptController],
  providers: [QuizAttemptService],
})
export class QuizModule {}