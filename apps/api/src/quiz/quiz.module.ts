import { Module } from '@nestjs/common';
import { QuizAttemptService } from './quiz.service';
import { QuizAttemptController } from './quiz.controller';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
  imports: [GeminiModule],
  controllers: [QuizAttemptController],
  providers: [QuizAttemptService],
})
export class QuizModule {}