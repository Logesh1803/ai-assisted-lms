import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  BadRequestException,
} from "@nestjs/common";
import { ValidationError } from "class-validator";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const timestamp = new Date().toISOString();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      if (exception instanceof BadRequestException) {
        const response = host.switchToHttp().getResponse();
        const res = exception.getResponse() as any;

        const timestamp = new Date().toISOString();

        // Validation errors
        if (
          res?.message &&
          Array.isArray(res.message) &&
          res.message[0]?.property
        ) {
          const errors = this.flattenValidationErrors(res.message);
          return response.status(400).json({
            success: false,
            message: "Validation failed",
            errors,
            timestamp,
          });
        }
      }

      // Other HTTP errors
      return response.status(status).json({
        success: false,
        message:
          exceptionResponse?.message || exception.message || "Request failed",
        errors: {},
        timestamp,
      });
    }
    console.log(`HTTP Error: ${exception.message}`, exception.stack);
    // Non-HTTP errors
    return response.status(500).json({
      success: false,
      message: "Internal Server Error",
      errors: {},
      timestamp,
    });
  }

  flattenValidationErrors(
    errors: ValidationError[],
    parentPath = "",
  ): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    for (const error of errors) {
      const fieldPath = parentPath
        ? `${parentPath}.${error.property}`
        : error.property;

      if (error.constraints) {
        result[fieldPath] = Object.values(error.constraints);
      }

      if (error.children && error.children.length > 0) {
        Object.assign(
          result,
          this.flattenValidationErrors(error.children, fieldPath),
        );
      }
    }

    return result;
  }
}
