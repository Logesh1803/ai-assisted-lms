import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AiSummaryService } from "./ai-summary.service";
import { JwtAuthGuard } from "@/common/guard/jwt-auth.guard";
import { ApiSwaggerEndpoint } from "@/common/decorators";

@ApiTags("AI Summary")
@UseGuards(JwtAuthGuard)
@Controller("ai-summary")
export class AiSummaryController {
  constructor(private readonly aiSummaryService: AiSummaryService) {}

  // POST /ai-summary/:courseUuid/generate
  @Post(":courseUuid/generate")
  @ApiSwaggerEndpoint({
    summary: "Generate course summary",
    description:
      "Generate or regenerate an AI summary and key points for a course using Gemini",
    params: [
      { name: "courseUuid", required: true, description: "UUID of the course" },
    ],
  })
  generate(@Param("courseUuid") courseUuid: string, @Request() req) {
    return this.aiSummaryService.generate(courseUuid, req.user.id);
  }

  // GET /ai-summary/:courseUuid
  @Get(":courseUuid")
  @ApiSwaggerEndpoint({
    summary: "Get course summary",
    description: "Get the existing AI-generated summary for a course",
    params: [
      { name: "courseUuid", required: true, description: "UUID of the course" },
    ],
  })
  getByCourse(@Param("courseUuid") courseUuid: string) {
    return this.aiSummaryService.getByCourse(courseUuid);
  }

  // DELETE /ai-summary/:courseUuid
  @Delete(":courseUuid")
  @ApiSwaggerEndpoint({
    summary: "Delete course summary",
    description: "Delete the AI-generated summary for a course",
    params: [
      { name: "courseUuid", required: true, description: "UUID of the course" },
    ],
  })
  delete(@Param("courseUuid") courseUuid: string) {
    return this.aiSummaryService.delete(courseUuid);
  }
}
