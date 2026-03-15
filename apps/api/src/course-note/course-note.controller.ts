import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CourseNoteService } from './course-note.service';
import { CreateCourseNoteDto } from './dto/course-note.dto';

@ApiTags('Course Notes')
@ApiBearerAuth()
@Controller('course-notes')
export class CourseNoteController {
  constructor(private readonly courseNoteService: CourseNoteService) {}

  // POST /course-notes/:courseUuid/upload — teacher uploads a note/file
  @Post(':courseUuid/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  upload(
    @Param('courseUuid') courseUuid: string,
    @Body() dto: CreateCourseNoteDto,
    @Request() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.courseNoteService.upload(courseUuid, req.user.id, dto, file);
  }

  // GET /course-notes/:courseUuid — list notes for a course
  @Get(':courseUuid')
  findByCourse(@Param('courseUuid') courseUuid: string) {
    return this.courseNoteService.findByCourse(courseUuid);
  }

  // DELETE /course-notes/:noteUuid — teacher deletes a note
  @Delete(':noteUuid')
  remove(@Param('noteUuid') noteUuid: string, @Request() req) {
    return this.courseNoteService.remove(noteUuid, req.user.id);
  }
}
