import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 8000);
}
bootstrap()
  .then(() => {
    console.log("App is running on port: " +  8000);
  })
  .catch((error) => {
    console.error(error);
  });

