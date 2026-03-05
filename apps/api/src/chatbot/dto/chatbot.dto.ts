import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  sessionUuid?: string;

  @IsOptional()
  @IsInt()
  courseId?: number;

  @IsOptional()
  @IsString()
  courseContext?: string;
}

export class ExplainConceptDto {
  @IsString()
  @IsNotEmpty()
  term: string;

  @IsString({ each: true })
  @IsNotEmpty()
  subjects: string[];
}
