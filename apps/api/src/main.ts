import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import {
  BadRequestException,
  ValidationPipe,
  VersioningType,
} from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { GlobalExceptionFilter } from "./common/core/global-expection";
import { SuccessResponseInterceptor } from "./common/core/success-response.interceptor";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as path from "path";
import * as fs from "fs";

const SWAGGER_CDN = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.30.2";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Ensure uploads directory exists and serve as static files at /uploads
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
    prefix: "v",
  });

  app.enableCors({
    origin: "*",
    credentials: true,
    exposedHeaders: ['x-firm-name'],
  });

  app.setGlobalPrefix("api");

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new SuccessResponseInterceptor(app.get(Reflector)));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties from DTOs
      forbidNonWhitelisted: true, // Throw error if unknown properties are present
      transform: true, // Automatically transform payloads to DTO instances
      disableErrorMessages: false,
      validateCustomDecorators: true,
      exceptionFactory: (validationErrors) => {
        console.log(validationErrors, "Validation Errors");
        return new BadRequestException(validationErrors);
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("Samera API")
    .setDescription("API documentation for Samera multi-tenant system")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },

    customCssUrl: [`${SWAGGER_CDN}/swagger-ui.css`],
    customJs: [
      `${SWAGGER_CDN}/swagger-ui-bundle.js`,
      `${SWAGGER_CDN}/swagger-ui-standalone-preset.js`,
    ],
  });

  app.getHttpAdapter().get("/api/json", (_req: any, res: any) => {
    res.type("application/json");
    res.send(document);
  });

  await app.listen(process.env.PORT ?? 8080);
}
bootstrap()
  .then(() => {
    console.log(`App is running on port: ${process.env.PORT || 8080}`);
  })
  .catch((error) => {
    console.error(error);
  });

