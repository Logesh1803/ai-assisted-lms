import { IsOptional, IsEnum } from "class-validator";
import { EnrollmentStatus } from "@thinkbloom/data-sources";
import { PaginationQueryDto } from "@/common/dto/base.dto";

import { IsString, IsNotEmpty } from "class-validator";

export class CreateEnrollmentDto {
  @IsString()
  @IsNotEmpty()
  courseUuid: string;
}

export class QueryEnrollmentDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;
}
