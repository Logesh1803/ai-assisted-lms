import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import {SystemsDatabaseModule} from "@thinkbloom/data-sources";
import {ConfigModule} from "@nestjs/config";
import {getEnvFilePath} from "@thinkbloom/utils";
import { UserModule } from './user/user.module';
import {BULL_QUEUES, BullMQModule} from "message-queues/src";
import { EventEmitterModule } from "@nestjs/event-emitter";
import {APP_GUARD} from "@nestjs/core";
import {JwtAuthGuard} from "@/common/guard/jwt-auth.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath:getEnvFilePath(),
      isGlobal:true
    }),
    EventEmitterModule.forRoot(),
    BullMQModule.register({
      queues: [
        BULL_QUEUES.NOTIFICATIONS,
      ],
      enableBullBoard: true,
    }),
    AuthModule,SystemsDatabaseModule, UserModule],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // {
    //   provide: APP_GUARD,
    //   useClass: AuthorizationGuard,
    // },
  ],
})
export class AppModule {}
