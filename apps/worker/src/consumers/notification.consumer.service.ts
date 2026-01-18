import { Processor } from "@nestjs/bullmq";
import { SystemsDatabaseService } from "@thinkbloom/data-sources";
import {
  BULL_QUEUES,
  BullMQWorkerHost,
  NOTIFICATION_JOBS,
} from "message-queues/src";
import { NotificationService } from "notifications/src";
// import {
//   generateOtp,
//   hashOtp,
// } from "@thinkbloom/utils";
// import {getUnixTimestampPlusSeconds} from "utils/src/date-formatter.service";

@Processor(BULL_QUEUES.NOTIFICATIONS)
export class NotificationConsumerService extends BullMQWorkerHost {
  constructor(
    private readonly notificationService: NotificationService,
    //private readonly systemPrisma: SystemsDatabaseService,
  ) {
    super();
  }

  async process(job: any): Promise<any> {
    switch (job.name) {
      case NOTIFICATION_JOBS.USER_PASSWORD_RESET:
        console.log(
          "User created consumner job consumed: ",
          job.name,
          job.data,
        );
        await this.notificationService.sendUserPasswordResetNotification(job.data);
        break;
      // case NOTIFICATION_JOBS.USER_OTP: {
      //   console.log("User otp consumner job consumed: ", job.name, job.data);
      //   const otp = generateOtp();
      //   const hashedOtp = hashOtp(otp);
      //   await this.systemPrisma.$transaction(async (tx) => {
      //     await tx.user.update({
      //       where: { id: job.data.userId },
      //       data: {
      //         otp_hash: hashedOtp,
      //         otp_expires_at: getUnixTimestampPlusSeconds(300),
      //         otp_sent_count: { increment: 1 },
      //       },
      //     });
      //   });
      //   await this.notificationService.sentOtp(job.data.email, otp);
      //   break;
      // }
      default:
        throw new Error(`Unknown job topic: ${job.name}`);
    }
  }
}
