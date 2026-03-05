import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';
import { GeminiService } from '../gemini/gemini.service';
import { JwtAuthGuard } from '@/common/guard/jwt-auth.guard';
import * as fs from 'fs';

@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly geminiService: GeminiService,
  ) {}

  @Post('analyze-video')
  @UseInterceptors(FileInterceptor('video', { storage: memoryStorage() }))
  async analyzeVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No video file provided');
    // Always save temp locally — Gemini File API needs a local file path
    const { filePath, mimeType } = this.uploadService.saveTempFile(file);
    try {
      return await this.geminiService.analyzeVideoFile(filePath, mimeType);
    } finally {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }
}
