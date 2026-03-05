import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guard/jwt-auth.guard';
import { ChatbotService } from './chatbot.service';
import { SendMessageDto, ExplainConceptDto } from './dto/chatbot.dto';

@ApiTags('Chatbot')
@UseGuards(JwtAuthGuard)
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  // POST /chatbot/message
  @Post('message')
  sendMessage(@Body() dto: SendMessageDto, @Request() req) {
    return this.chatbotService.sendMessage(req.user.id, dto);
  }

  // GET /chatbot/sessions
  @Get('sessions')
  getSessions(@Request() req) {
    return this.chatbotService.getSessions(req.user.id);
  }

  // GET /chatbot/sessions/:uuid
  @Get('sessions/:uuid')
  getSession(@Param('uuid') uuid: string, @Request() req) {
    return this.chatbotService.getSession(uuid, req.user.id);
  }

  // DELETE /chatbot/sessions/:uuid
  @Delete('sessions/:uuid')
  deleteSession(@Param('uuid') uuid: string, @Request() req) {
    return this.chatbotService.deleteSession(uuid, req.user.id);
  }

  // POST /chatbot/explain-concept
  @Post('explain-concept')
  explainConcept(@Body() dto: ExplainConceptDto) {
    return this.chatbotService.explainConcept(dto);
  }
}
