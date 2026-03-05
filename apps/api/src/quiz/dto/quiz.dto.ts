import {
  IsArray,
  IsNotEmpty,
  ValidateNested,
  IsInt,
  IsString,
  IsOptional,
  IsNumberString,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum QuestionType {
  MCQ = 'MCQ',
  SHORT_ANSWER = 'SHORT_ANSWER',
}

export class QuestionDto {
  @IsInt()
  id: number;

  @IsEnum(QuestionType)
  @IsOptional()
  type?: QuestionType = QuestionType.MCQ;

  @IsString()
  @IsNotEmpty()
  question: string;

  @IsArray()
  @IsOptional()
  options?: string[];

  @IsString()
  @IsNotEmpty()
  correct_answer: string;

  @IsArray()
  @IsOptional()
  keywords?: string[];

  @IsString()
  @IsNotEmpty()
  topic: string;
}

export class StartQuizDto {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];
}

export class AnswerDto {
  @IsInt()
  questionId: number;

  @IsString()
  @IsNotEmpty()
  answer: string;
}

export class SubmitQuizDto {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}

export class QueryQuizAttemptDto {
  @IsOptional()
  @IsNumberString()
  page?: number;

  @IsOptional()
  @IsNumberString()
  limit?: number;
}

export class GenerateQuestionsDto {
  @IsInt()
  @IsOptional()
  @Min(5)
  @Max(30)
  mcqCount?: number = 8;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(15)
  shortAnswerCount?: number = 2;
}
