import { Module } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { LessonController } from './lesson.controller';
import { UploadService } from '@/upload/upload.service';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
  imports: [GeminiModule],
  controllers: [LessonController],
  providers: [LessonService, UploadService],
  exports: [LessonService],
})
export class LessonModule {}
