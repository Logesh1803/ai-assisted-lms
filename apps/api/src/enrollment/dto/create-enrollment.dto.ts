
import { IsOptional, IsEnum, IsNumberString } from 'class-validator';
import { EnrollmentStatus } from '@thinkbloom/data-sources';

import { IsString, IsNotEmpty } from 'class-validator';

export class CreateEnrollmentDto {
  @IsString()
  @IsNotEmpty()
  courseUuid: string;
}

export class QueryEnrollmentDto {
  @IsOptional()
  @IsNumberString()
  page?: number;

  @IsOptional()
  @IsNumberString()
  limit?: number;

  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;
}