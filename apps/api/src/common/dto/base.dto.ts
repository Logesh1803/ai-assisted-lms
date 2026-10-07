import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";
import {
  AddressField,
  EmailField,
  OtpField,
  PasswordField,
  PhoneField,
  TokenField,
  UserNameField,
} from "../decorators";

// Base user info dto

export class UserNameDto {
  @UserNameField("John", 25, "First Name", true)
  firstName: string;

  @UserNameField("Doe", 25, "Last Name", false)
  lastName: string;
}

export class EmailDto {
  @EmailField()
  email: string;
}

export class PhoneDto {
  @PhoneField()
  phone: string;
}

export class AddressDto {
  @AddressField()
  address: string;
}

// Base auth dto

export class VerificationTokenDto {
  @TokenField()
  token: string;
}

export class VerificationOtpDto {
  @OtpField()
  otp: string;
}
export class PlainPasswordDto {
  @PasswordField()
  password: string;
}

export class StrongPasswordDto {
  @PasswordField(true)
  password: string;
}

/**
 * `page` and `limit` for list endpoints. Query values arrive as strings, so
 * @Type turns them into numbers before the checks run.
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
