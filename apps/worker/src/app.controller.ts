import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  constructor() {}

  @Get()
  workerInitialized() {
    return "Worker Initialized";
  }
}
