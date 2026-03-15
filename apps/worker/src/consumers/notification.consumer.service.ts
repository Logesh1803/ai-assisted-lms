import { Processor } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import {
  BULL_QUEUES,
  BullMQWorkerHost,
  NOTIFICATION_JOBS,
} from "message-queues/src";
import { NotificationService } from "notifications/src";
@Processor(BULL_QUEUES.NOTIFICATIONS)
export class NotificationConsumerService extends BullMQWorkerHost {
  protected readonly logger = new Logger(NotificationConsumerService.name);

  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  async process(job: any): Promise<any> {
    this.logger.log(`Processing notification job: ${job.name}`);

    switch (job.name) {
      case NOTIFICATION_JOBS.USER_PASSWORD_RESET:
        await this.notificationService.sendUserPasswordResetNotification(job.data);
        break;

      case NOTIFICATION_JOBS.ENROLLMENT_CONFIRMATION:
        await this.notificationService.sendEnrollmentConfirmation(job.data);
        break;

      case NOTIFICATION_JOBS.QUIZ_COMPLETED:
        await this.notificationService.sendQuizCompleted(job.data);
        break;

      case NOTIFICATION_JOBS.LESSON_COMPLETED:
        this.logger.log(`Lesson completed notification for: ${job.data.studentEmail}`);
        // Optional: implement lesson completion email if needed
        break;

      case NOTIFICATION_JOBS.USER_OTP:
        await this.notificationService.sentOtp(job.data.email, job.data.otp);
        break;

      case NOTIFICATION_JOBS.COURSE_NOTE_UPLOADED:
        await this.notificationService.sendCourseNoteUploaded(job.data);
        break;

      case NOTIFICATION_JOBS.QUIZ_ATTEMPTED_TEACHER:
        await this.notificationService.sendQuizAttemptedTeacher(job.data);
        break;

      default:
        this.logger.warn(`Unknown notification job: ${job.name}`);
        throw new Error(`Unknown job topic: ${job.name}`);
    }
  }
}
