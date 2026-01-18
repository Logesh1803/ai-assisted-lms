import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.WORKER_PORT ?? 8081);
}
bootstrap()
  .then(() => {
    console.log("Worker Server is running!");
  })
  .catch((err) => {
    console.log("Unable to connect to the server", err);
  });
