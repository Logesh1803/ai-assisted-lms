import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '@/common/guard/jwt-auth.guard';
import { CourseStatus } from '@thinkbloom/data-sources';

@ApiTags('Courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  // POST /courses — teacher creates a course
  @Post()
  create(@Body() dto: CreateCourseDto, @Request() req) {
    return this.courseService.create(dto, req.user.id);
  }

  // POST /courses/generate-from-prompt — AI course generation
  @Post('generate-from-prompt')
  generateFromPrompt(@Body('prompt') prompt: string, @Request() req) {
    return this.courseService.generateFromPrompt(prompt, req.user.id);
  }

  // GET /courses — all published courses (student browse)
  @Get()
  findAll(@Query() query: any) {
    return this.courseService.findAll(query);
  }

  // GET /courses/mine — teacher's own courses
  @Get('mine')
  findMyCourses(@Request() req, @Query() query: any) {
    return this.courseService.findMyCourses(req.user.id, query);
  }

  // GET /courses/:uuid — single course detail
  @Get(':uuid')
  findOne(@Param('uuid') uuid: string, @Request() req) {
    return this.courseService.findOne(uuid, req.user.id);
  }

  // PUT /courses/:uuid — update course
  @Put(':uuid')
  update(
    @Param('uuid') uuid: string,
    @Body() dto: UpdateCourseDto,
    @Request() req,
  ) {
    return this.courseService.update(uuid, dto, req.user.id);
  }

  // PATCH /courses/:uuid/status — publish/archive
  @Patch(':uuid/status')
  changeStatus(
    @Param('uuid') uuid: string,
    @Body('status') status: CourseStatus,
    @Request() req,
  ) {
    return this.courseService.changeStatus(uuid, status, req.user.id);
  }

  // DELETE /courses/:uuid
  @Delete(':uuid')
  remove(@Param('uuid') uuid: string, @Request() req) {
    return this.courseService.remove(uuid, req.user.id);
  }

  // GET /courses/:uuid/performance — student performance (teacher)
  @Get(':uuid/performance')
  getStudentPerformance(@Param('uuid') uuid: string, @Request() req) {
    return this.courseService.getStudentPerformance(uuid, req.user.id);
  }
}
