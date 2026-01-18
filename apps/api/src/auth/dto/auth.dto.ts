import {ApiProperty, IntersectionType} from "@nestjs/swagger";
import {EmailDto, PlainPasswordDto, StrongPasswordDto, VerificationOtpDto, VerificationTokenDto} from "@/common/dto/base.dto";
import {IsEnum} from "class-validator";
import {TokenType} from "data-sources/generated/system/enums";

// User Login DTO
export class UserLoginDto extends IntersectionType(
  EmailDto,
  PlainPasswordDto
){}

// Set New Password DTO
export class SetNewPasswordDto extends IntersectionType(
  EmailDto,
  StrongPasswordDto,
  VerificationTokenDto
){
  @ApiProperty({enum:TokenType,enumName:"type",example:TokenType.PASSWORD_RESET})
  @IsEnum(TokenType)
  type:TokenType;
}

// Forgot Password DTO
export class ForgotPasswordDto extends EmailDto{}

// Resend OTP DTO
export class ResendOtpDto extends VerificationTokenDto{}

// Verify OTP DTO
export class VerifyOtpDto extends IntersectionType(
  VerificationTokenDto,
  VerificationOtpDto
){}

// Verify Token DTO
export  class VerifyTokenDto extends IntersectionType(
  EmailDto,
){
  @ApiProperty({enum:TokenType,enumName:"type",example:TokenType.EMAIL_VERIFICATION})
  @IsEnum(TokenType)
  type:TokenType;
}


