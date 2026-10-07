import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

/** Filters accepted by `GET /lessons`. */
export class QueryLessonDto {
  /** Restrict to the lessons of a single course. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  course_id?: number;

  /** Restrict to lessons belonging to one teacher's courses. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teacher_id?: number;

  /** Free-text match against the lesson title and description. */
  @IsOptional()
  @IsString()
  search?: string;
}
