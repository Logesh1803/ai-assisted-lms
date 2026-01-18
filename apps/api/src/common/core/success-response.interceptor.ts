import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { SUCCESS_MESSAGE } from "../decorators/swagger/success-message.decorator";
import { Reflector } from "@nestjs/core";

@Injectable()
export class SuccessResponseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest();
    const res = httpCtx.getResponse();

    const successMessage =
      this.reflector.get<string>(SUCCESS_MESSAGE, context.getHandler()) ||
      "Operation completed successfully";

    if (req.firmName) {
      res.setHeader("x-firm-id", req.firmUuid);
      res.setHeader("x-firm-name", req.firmName);
    }
    return next.handle().pipe(
      map((data) => ({
        success: true,
        message: successMessage,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
