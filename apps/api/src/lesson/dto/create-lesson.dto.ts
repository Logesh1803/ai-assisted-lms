
import { IsInt, IsString, IsOptional, IsUrl, Min } from 'class-validator';

export class CreateLessonDto {
  @IsInt()
  course_id: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsUrl()
  video_url?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;
}