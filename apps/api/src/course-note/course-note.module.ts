import { Module } from "@nestjs/common";
import { CourseNoteController } from "./course-note.controller";
import { CourseNoteService } from "./course-note.service";
import { UploadModule } from "../upload/upload.module";
import { BullMQModule, BULL_QUEUES } from "@thinkbloom/message-queues";

@Module({
  imports: [
    UploadModule,
    BullMQModule.register({ queues: [BULL_QUEUES.NOTIFICATIONS] }),
  ],
  controllers: [CourseNoteController],
  providers: [CourseNoteService],
})
export class CourseNoteModule {}
