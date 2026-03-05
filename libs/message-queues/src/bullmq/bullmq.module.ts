import { DynamicModule, Global, Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { BullBoardModule } from "@bull-board/nestjs";
import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ConfigModule, ConfigService } from "@nestjs/config";
import basicAuth from "express-basic-auth";
import { NotificationProducerService } from "./producers/notification.producer.service";
import { VideoProducerService } from "./producers/video.producer.service";
import { BULL_QUEUES } from "../queues.constant";

export interface QueueSystemOptions {
  queues: string[];
  enableBullBoard?: boolean;
}

@Global()
@Module({})
export class BullMQModule {
  static register(options: QueueSystemOptions): DynamicModule {
    const enableBullBoard = options.enableBullBoard! === true;

    // Always register both queues regardless of the queues option
    const allQueues = [
      ...new Set([...options.queues, BULL_QUEUES.NOTIFICATIONS, BULL_QUEUES.VIDEO_PROCESSING]),
    ];

    return {
      module: BullMQModule,
      providers: [
        NotificationProducerService,
        VideoProducerService,
      ],
      exports: [
        NotificationProducerService,
        VideoProducerService,
      ],
      imports: [
        ConfigModule,
        BullModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (configService: ConfigService) => {
            const isTlsEnabled =
              configService.get("REDIS_TLS_ENABLED") === "true";

            return {
              connection: {
                host: configService.get("REDIS_HOST"),
                port: configService.get("REDIS_PORT"),
                username: configService.get("REDIS_USERNAME"),
                password: configService.get("REDIS_PASSWORD"),
                db: Number(configService.get("REDIS_DB")) || 1,
                ...(isTlsEnabled && {
                  tls: {
                    servername: configService.get("REDIS_HOST"),
                  },
                }),
              },
              prefix: "{bull}",
              defaultJobOptions: {
                removeOnComplete: 1000,
              },
            };
          },
        }),
        ...(enableBullBoard
          ? [
            BullBoardModule.forRootAsync({
              imports: [ConfigModule],
              inject: [ConfigService],
              useFactory: async (configService: ConfigService) => ({
                route: "/queues",
                adapter: ExpressAdapter,
                boardOptions: {
                  uiConfig: {
                    boardTitle: "ThinkBloom Queues",
                  },
                },
                middleware: basicAuth({
                  challenge: true,
                  users: {
                    [configService.get("BULL_BOARD_USERNAME")]:
                      configService.get("BULL_BOARD_PASSWORD") || "",
                  },
                }),
              }),
            }),

            ...allQueues.map((queueName) =>
              BullBoardModule.forFeature({
                name: queueName,
                adapter: BullMQAdapter,
              }),
            ),
          ]
          : []),
        ...allQueues.flatMap((queueName) => [
          BullModule.registerQueue({ name: queueName })
        ]),
      ],
    };
  }
}
