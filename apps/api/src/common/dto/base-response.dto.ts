import { ApiProperty } from "@nestjs/swagger";

export class BaseResponseDto<T = any> {
  @ApiProperty({
    description: "Indicates if the request was successful",
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: "Response message",
    example: "Operation completed successfully",
  })
  message: string;

  @ApiProperty({
    description: "Response data",
  })
  data?: T;

  @ApiProperty({
    description: "Error details (only present when success is false)",
    required: false,
  })
  errors?: string[];

  @ApiProperty({
    description: "Response timestamp",
    example: "2024-06-15T10:30:00.000Z",
  })
  timestamp: string;
}

export class SuccessResponseDto<T = any> extends BaseResponseDto<T> {
  declare success: true;
  declare data: T;
}

export class ErrorResponseDto extends BaseResponseDto {
  declare success: false;
  declare errors: string[];
}
