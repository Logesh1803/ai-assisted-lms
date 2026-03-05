import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { BULL_QUEUES, VIDEO_JOBS } from "../../queues.constant";
import { JobsOptions, Queue } from "bullmq";

@Injectable()
export class VideoProducerService {
  private readonly logger = new Logger(VideoProducerService.name);
  protected defaultJobOptions: JobsOptions = {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  };

  constructor(
    @InjectQueue(BULL_QUEUES.VIDEO_PROCESSING)
    private readonly videoQueue: Queue,
  ) {}

  async dispatchVideoProcess(data: {
    lessonId: number;
    lessonTitle: string;
    courseTitle: string;
    courseId: number;
    courseUuid: string;
    teacherName: string;
    teacherEmail: string;
    fileName: string;
    fileUrl: string;
    fileSize: string;
  }) {
    try {
      const { id } = await this.videoQueue.add(
        VIDEO_JOBS.PROCESS_VIDEO,
        data,
        this.defaultJobOptions,
      );
      this.logger.log(`Dispatched ${VIDEO_JOBS.PROCESS_VIDEO} for lesson ${data.lessonId}, job id: ${id}`);
      return id;
    } catch (error: any) {
      throw new Error(error);
    }
  }
}
