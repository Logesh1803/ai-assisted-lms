import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { CourseStatus } from "@thinkbloom/data-sources";
import { PaginationQueryDto } from "@/common/dto/base.dto";

/** Filters a student can apply when browsing published courses. */
export class QueryCourseDto extends PaginationQueryDto {
  /** Free-text match against the course title and description. */
  @IsOptional()
  @IsString()
  search?: string;

  /** One tag, or several repeated `tags=` values — always an array after this. */
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsString({ each: true })
  tags?: string[];
}

/** Filters a teacher can apply when listing their own courses. */
export class QueryMyCourseDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;
}
