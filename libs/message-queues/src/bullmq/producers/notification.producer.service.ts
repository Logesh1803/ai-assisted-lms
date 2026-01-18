import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { BULL_QUEUES, NOTIFICATION_JOBS } from "../../queues.constant";
import { JobsOptions, Queue } from "bullmq";

@Injectable()
export class NotificationProducerService {
  private readonly logger = new Logger(NotificationProducerService.name);
  protected defaultJobOptions: JobsOptions = {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 10000,
    },
  };


  constructor(
    @InjectQueue(BULL_QUEUES.NOTIFICATIONS)
    private readonly provisionQueue: Queue,
  ) {}

  async dispatachUserPasswordResetNotification(userTokenData: any) {
    try {
      console.table(userTokenData)
      const { id } = await this.provisionQueue.add(
        NOTIFICATION_JOBS.USER_PASSWORD_RESET,
        userTokenData,
        this.defaultJobOptions,
      );
      this.logger.log("Produced id: ", id);
      return id;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async sentOtp(data: any) {
    try {
      const { id } = await this.provisionQueue.add(
        NOTIFICATION_JOBS.USER_OTP,
        data,
        this.defaultJobOptions,
      );
      this.logger.log("Produced id: ", id);
      return id;
    } catch (error: any) {
      throw new Error(error);
    }
  }
}
