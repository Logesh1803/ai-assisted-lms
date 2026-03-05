import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { EnrollmentService } from "./enrollment.service";
import { QueryEnrollmentDto } from "./dto/create-enrollment.dto";
import { ApiSwaggerEndpoint } from "@/common/decorators";
import { JwtAuthGuard } from "@/common/guard/jwt-auth.guard";

@ApiTags("Enrollments")
@UseGuards(JwtAuthGuard)
@Controller("enrollments")
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  // POST /enrollments/:courseUuid
  @Post(":courseUuid")
  @ApiSwaggerEndpoint({
    summary: "Enroll in a course",
    description: "Enroll the authenticated student into a course",
    params: [
      { name: "courseUuid", required: true, description: "UUID of the course" },
    ],
  })
  enroll(@Param("courseUuid") courseUuid: string, @Request() req) {
    return this.enrollmentService.enroll(req.user.id, courseUuid, req.user.id);
  }

  // GET /enrollments/me
  @Get("me")
  @ApiSwaggerEndpoint({
    summary: "Get my enrollments",
    description: "Get all enrollments for the authenticated student",
    queries: [
      { name: "page", required: false },
      { name: "limit", required: false },
      {
        name: "status",
        required: false,
        description: "Filter by enrollment status (ACTIVE, COMPLETED, DROPPED)",
      },
    ],
  })
  getMyEnrollments(@Request() req, @Query() query: QueryEnrollmentDto) {
    return this.enrollmentService.getStudentEnrollments(req.user.id, query);
  }

  // GET /enrollments/course/:courseUuid
  @Get("course/:courseUuid")
  @ApiSwaggerEndpoint({
    summary: "Get course enrollments",
    description: "Get all enrollments for a specific course (teacher view)",
    params: [
      { name: "courseUuid", required: true, description: "UUID of the course" },
    ],
    queries: [
      { name: "page", required: false },
      { name: "limit", required: false },
      {
        name: "status",
        required: false,
        description: "Filter by enrollment status",
      },
    ],
  })
  getCourseEnrollments(
    @Param("courseUuid") courseUuid: string,
    @Query() query: QueryEnrollmentDto,
  ) {
    return this.enrollmentService.getCourseEnrollments(courseUuid, query);
  }

  // GET /enrollments/:uuid
  @Get(":uuid")
  @ApiSwaggerEndpoint({
    summary: "Get enrollment by UUID",
    description: "Get a single enrollment with lesson progress details",
    params: [
      { name: "uuid", required: true, description: "UUID of the enrollment" },
    ],
  })
  findOne(@Param("uuid") uuid: string) {
    return this.enrollmentService.findOne(uuid);
  }

  // DELETE /enrollments/:uuid/drop
  @Delete(":uuid/drop")
  @ApiSwaggerEndpoint({
    summary: "Drop enrollment",
    description: "Drop (withdraw from) a course enrollment",
    params: [
      { name: "uuid", required: true, description: "UUID of the enrollment" },
    ],
  })
  drop(@Param("uuid") uuid: string, @Request() req) {
    return this.enrollmentService.drop(uuid, req.user.id);
  }
}
