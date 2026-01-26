import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AiSummaryService } from './ai-summary.service';
import { CreateAiSummaryDto } from './dto/create-ai-summary.dto';
import { UpdateAiSummaryDto } from './dto/update-ai-summary.dto';
import {ApiBearerAuth, ApiTags} from "@nestjs/swagger";

ApiTags("AI-Summary")
@ApiBearerAuth()
@Controller('ai-summary')
export class AiSummaryController {
  constructor(private readonly aiSummaryService: AiSummaryService) {}

  @Post()
  create(@Body() createAiSummaryDto: CreateAiSummaryDto) {
    return this.aiSummaryService.create(createAiSummaryDto);
  }

  @Get()
  findAll() {
    return this.aiSummaryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aiSummaryService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAiSummaryDto: UpdateAiSummaryDto) {
    return this.aiSummaryService.update(+id, updateAiSummaryDto);
  }

}
