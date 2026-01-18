import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { getEnvFilePath } from "@thinkbloom/utils";
import { BULL_QUEUES, BullMQModule } from "message-queues/src";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "@/app.controller";
import { NotificationConsumerService } from "./consumers/notification.consumer.service";
import {NotificationModule} from "notifications/src";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: getEnvFilePath(),
      isGlobal: true,
    }),
    BullMQModule.register({
      queues: [
        BULL_QUEUES.NOTIFICATIONS,
      ],
    }),
    ScheduleModule.forRoot(),
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [
    NotificationConsumerService,
  ],
})
export class AppModule {}
