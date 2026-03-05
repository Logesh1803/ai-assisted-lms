import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  ParseIntPipe,
  Body,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { LessonProgressService } from "./lesson-progress.service";
import { JwtAuthGuard } from "@/common/guard/jwt-auth.guard";
import { ApiSwaggerEndpoint } from "@/common/decorators";
import { UpdateWatchTimeDto } from "./dto/lesson-progress.dto";

@ApiTags("Lesson Progress")
@UseGuards(JwtAuthGuard)
@Controller("lesson-progress")
export class LessonProgressController {
  constructor(private readonly lessonProgressService: LessonProgressService) {}

  // POST /lesson-progress/:lessonId/complete
  @Post(":lessonId/complete")
  @ApiSwaggerEndpoint({
    summary: "Mark lesson as complete",
    description:
      "Mark a lesson as completed for the authenticated student and recalculate enrollment progress",
    params: [
      { name: "lessonId", required: true, description: "ID of the lesson" },
    ],
  })
  markComplete(
    @Param("lessonId", ParseIntPipe) lessonId: number,
    @Request() req,
  ) {
    return this.lessonProgressService.markComplete(lessonId, req.user.id);
  }

  // PATCH /lesson-progress/:lessonId/watch-time
  @Patch(":lessonId/watch-time")
  @ApiSwaggerEndpoint({
    summary: "Update watch time",
    description: "Update the video watch time (in seconds) for a lesson",
    params: [
      { name: "lessonId", required: true, description: "ID of the lesson" },
    ],
    bodyDto: UpdateWatchTimeDto,
  })
  updateWatchTime(
    @Param("lessonId", ParseIntPipe) lessonId: number,
    @Body() dto: UpdateWatchTimeDto,
    @Request() req,
  ) {
    return this.lessonProgressService.updateWatchTime(
      lessonId,
      req.user.id,
      dto,
    );
  }

  // GET /lesson-progress/enrollment/:enrollmentUuid
  @Get("enrollment/:enrollmentUuid")
  @ApiSwaggerEndpoint({
    summary: "Get progress by enrollment",
    description: "Get all lesson progress records for a specific enrollment",
    params: [
      {
        name: "enrollmentUuid",
        required: true,
        description: "UUID of the enrollment",
      },
    ],
  })
  getByEnrollment(@Param("enrollmentUuid") enrollmentUuid: string) {
    return this.lessonProgressService.getByEnrollment(enrollmentUuid);
  }

  // GET /lesson-progress/:lessonId
  @Get(":lessonId")
  @ApiSwaggerEndpoint({
    summary: "Get lesson progress",
    description:
      "Get progress for a specific lesson for the authenticated student",
    params: [
      { name: "lessonId", required: true, description: "ID of the lesson" },
    ],
  })
  getOne(@Param("lessonId", ParseIntPipe) lessonId: number, @Request() req) {
    return this.lessonProgressService.getOne(lessonId, req.user.id);
  }
}
