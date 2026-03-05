import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { QuizAttemptService } from "./quiz.service";
import { JwtAuthGuard } from "@/common/guard/jwt-auth.guard";
import { ApiSwaggerEndpoint } from "@/common/decorators";
import {
  GenerateQuestionsDto,
  QueryQuizAttemptDto,
  StartQuizDto,
  SubmitQuizDto,
} from "./dto/quiz.dto";

@ApiTags("Quiz")
@UseGuards(JwtAuthGuard)
@Controller("quiz")
export class QuizAttemptController {
  constructor(private readonly quizAttemptService: QuizAttemptService) {}

  // POST /quiz/:courseUuid/generate-questions
  @Post(":courseUuid/generate-questions")
  @ApiSwaggerEndpoint({
    summary: "Generate quiz questions (AI)",
    description:
      "Use Gemini AI to generate multiple choice questions based on course lessons",
    params: [
      { name: "courseUuid", required: true, description: "UUID of the course" },
    ],
    bodyDto: GenerateQuestionsDto,
  })
  generateQuestions(
    @Param("courseUuid") courseUuid: string,
    @Body() dto: GenerateQuestionsDto,
  ) {
    return this.quizAttemptService.generateQuestions(courseUuid, dto);
  }

  // POST /quiz/:courseUuid/start
  @Post(":courseUuid/start")
  @ApiSwaggerEndpoint({
    summary: "Start quiz attempt",
    description:
      "Start a quiz attempt with AI-generated or teacher-provided questions",
    params: [
      { name: "courseUuid", required: true, description: "UUID of the course" },
    ],
    bodyDto: StartQuizDto,
  })
  start(
    @Param("courseUuid") courseUuid: string,
    @Body() dto: StartQuizDto,
    @Request() req,
  ) {
    return this.quizAttemptService.start(courseUuid, req.user.id, dto);
  }

  // POST /quiz/attempt/:attemptUuid/submit
  @Post("attempt/:attemptUuid/submit")
  @ApiSwaggerEndpoint({
    summary: "Submit quiz attempt",
    description:
      "Submit answers, auto-score the quiz and generate Gemini AI feedback",
    params: [
      {
        name: "attemptUuid",
        required: true,
        description: "UUID of the quiz attempt",
      },
    ],
    bodyDto: SubmitQuizDto,
  })
  submit(
    @Param("attemptUuid") attemptUuid: string,
    @Body() dto: SubmitQuizDto,
    @Request() req,
  ) {
    return this.quizAttemptService.submit(attemptUuid, req.user.id, dto);
  }

  // GET /quiz/:courseUuid/my-attempts
  @Get(":courseUuid/my-attempts")
  @ApiSwaggerEndpoint({
    summary: "Get my quiz attempts",
    description:
      "Get all quiz attempts for the authenticated student in a course",
    params: [
      { name: "courseUuid", required: true, description: "UUID of the course" },
    ],
  })
  getMyAttempts(@Param("courseUuid") courseUuid: string, @Request() req) {
    return this.quizAttemptService.getMyAttempts(courseUuid, req.user.id);
  }

  // GET /quiz/attempt/:attemptUuid
  @Get("attempt/:attemptUuid")
  @ApiSwaggerEndpoint({
    summary: "Get single quiz attempt",
    description:
      "Get full details of a single quiz attempt including questions, answers and AI feedback",
    params: [
      {
        name: "attemptUuid",
        required: true,
        description: "UUID of the quiz attempt",
      },
    ],
  })
  findOne(@Param("attemptUuid") attemptUuid: string, @Request() req) {
    return this.quizAttemptService.findOne(attemptUuid, req.user.id);
  }

  // GET /quiz/:courseUuid/all-attempts
  @Get(":courseUuid/all-attempts")
  @ApiSwaggerEndpoint({
    summary: "Get all course attempts (teacher)",
    description: "Get all student quiz attempts for a course — teacher view",
    params: [
      { name: "courseUuid", required: true, description: "UUID of the course" },
    ],
    queries: [
      { name: "page", required: false },
      { name: "limit", required: false },
    ],
  })
  getCourseAttempts(
    @Param("courseUuid") courseUuid: string,
    @Query() query: QueryQuizAttemptDto,
  ) {
    return this.quizAttemptService.getCourseAttempts(courseUuid, query);
  }
}
