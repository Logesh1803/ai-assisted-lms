import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  Req,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { LessonService } from './lesson.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { JwtAuthGuard } from '@/common/guard/jwt-auth.guard';
import { Public } from '@/common/decorators';
import { Request as ExpressRequest, Response } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('lessons')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  // POST /lessons
  @Post()
  create(@Body() createLessonDto: CreateLessonDto, @Request() req) {
    return this.lessonService.create(createLessonDto, req.user.id);
  }

  // GET /lessons
  @Get()
  findAll(@Query() query: any) {
    return this.lessonService.findAll(query);
  }

  // GET /lessons/course/:courseId
  @Get('course/:courseId')
  findByCourse(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.lessonService.findByCourse(courseId);
  }

  // GET /lessons/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.lessonService.findOne(id, req.user.id);
  }

  // PATCH /lessons/:id
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLessonDto: UpdateLessonDto,
    @Request() req,
  ) {
    return this.lessonService.update(id, updateLessonDto, req.user.id);
  }

  // DELETE /lessons/:id
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.lessonService.remove(id, req.user.id);
  }

  // ─── Video Endpoints ─────────────────────────────────────────────────────

  // POST /lessons/:id/video — upload or replace video
  @Post(':id/video')
  @UseInterceptors(
    FileInterceptor('video', {
      storage: memoryStorage(),
      limits: { fileSize: 500 * 1024 * 1024 },
    }),
  )
  uploadVideo(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) throw new Error('No video file provided');
    return this.lessonService.uploadVideo(id, file, req.user.id);
  }

  // DELETE /lessons/:id/video
  @Delete(':id/video')
  deleteVideo(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.lessonService.deleteVideo(id, req.user.id);
  }

  // GET /lessons/:id/stream — range-based video streaming (public)
  @Get(':id/stream')
  @Public()
  streamVideo(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: ExpressRequest,
    @Res() res: Response,
  ) {
    return this.lessonService.streamVideo(id, req, res);
  }

  // ─── Notes Endpoints ─────────────────────────────────────────────────────

  // POST /lessons/:id/notes/generate — AI notes generation
  @Post(':id/notes/generate')
  generateNotes(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.lessonService.generateAndSaveNotes(id, req.user.id);
  }

  // GET /lessons/:id/notes — fetch notes
  @Get(':id/notes')
  getNotes(@Param('id', ParseIntPipe) id: number) {
    return this.lessonService.getNotes(id);
  }
}