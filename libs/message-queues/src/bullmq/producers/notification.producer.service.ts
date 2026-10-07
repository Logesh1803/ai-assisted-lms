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
    private readonly notificationQueue: Queue,
  ) {}

  async dispatachUserPasswordResetNotification(userTokenData: {
    userId: number;
    name: string;
    email: string;
    token: string;
    type: string;
  }) {
    try {
      const { id } = await this.notificationQueue.add(
        NOTIFICATION_JOBS.USER_PASSWORD_RESET,
        userTokenData,
        this.defaultJobOptions,
      );
      this.logger.log(`Dispatched ${NOTIFICATION_JOBS.USER_PASSWORD_RESET}, job id: ${id}`);
      return id;
    } catch (error) {
      this.logger.error(`Failed to dispatch ${NOTIFICATION_JOBS.USER_PASSWORD_RESET}`, error);
      throw error;
    }
  }

  async dispatchEnrollmentConfirmation(data: {
    studentName: string;
    studentEmail: string;
    courseTitle: string;
    courseUuid: string;
  }) {
    try {
      const { id } = await this.notificationQueue.add(
        NOTIFICATION_JOBS.ENROLLMENT_CONFIRMATION,
        data,
        this.defaultJobOptions,
      );
      this.logger.log(`Dispatched ${NOTIFICATION_JOBS.ENROLLMENT_CONFIRMATION}, job id: ${id}`);
      return id;
    } catch (error) {
      this.logger.error(`Failed to dispatch ${NOTIFICATION_JOBS.ENROLLMENT_CONFIRMATION}`, error);
      throw error;
    }
  }

  async dispatchQuizCompleted(data: {
    studentName: string;
    studentEmail: string;
    courseTitle: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    strongTopics: string[];
    weakTopics: string[];
    aiFeedback?: string;
  }) {
    try {
      const { id } = await this.notificationQueue.add(
        NOTIFICATION_JOBS.QUIZ_COMPLETED,
        data,
        this.defaultJobOptions,
      );
      this.logger.log(`Dispatched ${NOTIFICATION_JOBS.QUIZ_COMPLETED}, job id: ${id}`);
      return id;
    } catch (error) {
      this.logger.error(`Failed to dispatch ${NOTIFICATION_JOBS.QUIZ_COMPLETED}`, error);
      throw error;
    }
  }

  async dispatchLessonCompleted(data: {
    studentName: string;
    studentEmail: string;
    courseTitle: string;
    lessonTitle: string;
  }) {
    try {
      const { id } = await this.notificationQueue.add(
        NOTIFICATION_JOBS.LESSON_COMPLETED,
        data,
        this.defaultJobOptions,
      );
      this.logger.log(`Dispatched ${NOTIFICATION_JOBS.LESSON_COMPLETED}, job id: ${id}`);
      return id;
    } catch (error) {
      this.logger.error(`Failed to dispatch ${NOTIFICATION_JOBS.LESSON_COMPLETED}`, error);
      throw error;
    }
  }

  async sentOtp(data: { email: string; otp: string; name?: string }) {
    try {
      const { id } = await this.notificationQueue.add(
        NOTIFICATION_JOBS.USER_OTP,
        data,
        this.defaultJobOptions,
      );
      this.logger.log(`Dispatched ${NOTIFICATION_JOBS.USER_OTP}, job id: ${id}`);
      return id;
    } catch (error) {
      this.logger.error(`Failed to dispatch ${NOTIFICATION_JOBS.USER_OTP}`, error);
      throw error;
    }
  }

  async dispatchCourseNoteUploaded(data: {
    studentName: string;
    studentEmail: string;
    courseTitle: string;
    courseUuid: string;
    noteTitle: string;
  }) {
    try {
      const { id } = await this.notificationQueue.add(
        NOTIFICATION_JOBS.COURSE_NOTE_UPLOADED,
        data,
        this.defaultJobOptions,
      );
      this.logger.log(`Dispatched ${NOTIFICATION_JOBS.COURSE_NOTE_UPLOADED}, job id: ${id}`);
      return id;
    } catch (error) {
      this.logger.error(`Failed to dispatch ${NOTIFICATION_JOBS.COURSE_NOTE_UPLOADED}`, error);
      throw error;
    }
  }

  async dispatchQuizAttemptedTeacher(data: {
    teacherName: string;
    teacherEmail: string;
    studentName: string;
    courseTitle: string;
    courseUuid: string;
    attemptUuid: string;
    score: number;
  }) {
    try {
      const { id } = await this.notificationQueue.add(
        NOTIFICATION_JOBS.QUIZ_ATTEMPTED_TEACHER,
        data,
        this.defaultJobOptions,
      );
      this.logger.log(`Dispatched ${NOTIFICATION_JOBS.QUIZ_ATTEMPTED_TEACHER}, job id: ${id}`);
      return id;
    } catch (error) {
      this.logger.error(`Failed to dispatch ${NOTIFICATION_JOBS.QUIZ_ATTEMPTED_TEACHER}`, error);
      throw error;
    }
  }
}
