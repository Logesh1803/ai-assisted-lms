import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import {
  ErrorResponseDto,
  SuccessResponseDto,
} from "@/common/dto/base-response.dto";
import { applyDecorators, Type } from "@nestjs/common";

/** A DTO class Swagger should document the response with. */
type ApiResponseOption = {
  status: number;
  description: string;
  type?: Type<unknown>;
};

type ApiQueryOption = {
  name: string;
  required?: boolean;
  description?: string;
  example?: unknown;
};

type ApiParamOption = {
  name: string;
  required?: boolean;
  description?: string;
  example?: unknown;
};

export function ApiSwaggerEndpoint(options: {
  summary: string;
  bodyDto?: Type<unknown>;
  description?: string;
  successDescription?: string;
  successResponseDto?: Type<unknown>;
  requireFirmHeader?: boolean;
  queries?: ApiQueryOption[];
  params?: ApiParamOption[];
  responses?: ApiResponseOption[];
}) {
  const {
    summary,
    bodyDto,
    description,
    successDescription = "Request successful",
    successResponseDto,
    queries = [],
    params = [],
    responses = [],
  } = options;

  const decorators = [
    ApiOperation({ summary, description }),

    ApiResponse({
      status: 200,
      description: successDescription,
      type: successResponseDto ?? SuccessResponseDto,
    }),
  ];

  if (bodyDto) {
    decorators.push(
      ApiBody({
        type: bodyDto,
      }),
    );
  }

  queries.forEach((query) => {
    decorators.push(
      ApiQuery({
        name: query.name,
        required: query.required ?? false,
        ...(query.description && { description: query.description }),
        ...(query.example !== undefined && { example: query.example }),
      }),
    );
  });

  params.forEach((param) => {
    decorators.push(
      ApiParam({
        name: param.name,
        required: param.required ?? true,
        ...(param.description && { description: param.description }),
        ...(param.example !== undefined && { example: param.example }),
      }),
    );
  });

  responses.forEach((res) => {
    decorators.push(
      ApiResponse({
        status: res.status,
        description: res.description,
        type: res.type ?? ErrorResponseDto,
      }),
    );
  });

  return applyDecorators(...decorators);
}
