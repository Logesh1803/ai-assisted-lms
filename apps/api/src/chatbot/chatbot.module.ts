import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { GeminiModule } from '../gemini/gemini.module';
import { SystemsDatabaseModule } from '@thinkbloom/data-sources';

@Module({
  imports: [GeminiModule, SystemsDatabaseModule],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {}
