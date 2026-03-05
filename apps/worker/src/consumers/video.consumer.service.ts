import { Processor } from "@nestjs/bullmq";
import {
  BULL_QUEUES,
  BullMQWorkerHost,
  VIDEO_JOBS,
} from "message-queues/src";
import { NotificationService } from "notifications/src";
import { Logger } from "@nestjs/common";

@Processor(BULL_QUEUES.VIDEO_PROCESSING)
export class VideoConsumerService extends BullMQWorkerHost {
  protected readonly logger = new Logger(VideoConsumerService.name);

  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  async process(job: any): Promise<any> {
    this.logger.log(`Processing video job: ${job.name} for lesson ${job.data?.lessonId}`);

    switch (job.name) {
      case VIDEO_JOBS.PROCESS_VIDEO: {
        const {
          lessonId,
          lessonTitle,
          courseTitle,
          courseUuid,
          teacherName,
          teacherEmail,
          fileName,
          fileSize,
        } = job.data;

        this.logger.log(
          `Video processed — lesson: "${lessonTitle}", course: "${courseTitle}", file: ${fileName} (${fileSize})`,
        );

        // Send confirmation email to teacher
        await this.notificationService.sendVideoProcessed({
          teacherName,
          teacherEmail,
          lessonTitle,
          courseTitle,
          courseUuid,
          lessonId,
          fileName,
          fileSize,
        });

        this.logger.log(`Video upload email sent to teacher: ${teacherEmail}`);
        break;
      }

      default:
        this.logger.warn(`Unknown video job: ${job.name}`);
        throw new Error(`Unknown video job: ${job.name}`);
    }
  }
}
