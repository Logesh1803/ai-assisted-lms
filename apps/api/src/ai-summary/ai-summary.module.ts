import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiSummaryService } from './ai-summary.service';
import { AiSummaryController } from './ai-summary.controller';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
  imports: [GeminiModule, ConfigModule],
  controllers: [AiSummaryController],
  providers: [AiSummaryService],
})
export class AiSummaryModule {}