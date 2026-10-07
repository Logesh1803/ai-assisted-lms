import { ApiProperty, IntersectionType } from "@nestjs/swagger";
import {
  EmailDto,
  StrongPasswordDto,
  UserNameDto,
} from "@/common/dto/base.dto";
import { UserRole } from "@thinkbloom/data-sources";
import { IsEnum } from "class-validator";

// Create User DTO
export class CreateUserDto extends IntersectionType(
  UserNameDto,
  EmailDto,
  StrongPasswordDto,
) {
  @ApiProperty({
    enum: UserRole,
    enumName: "UserRole",
    example: UserRole.STUDENT,
  })
  @IsEnum(UserRole)
  role: UserRole;
}
