import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Req,
  Query,
} from "@nestjs/common";
import { DiscussionService } from "./discussion.service";
import { CreateThreadDto, CreateReplyDto } from "./dto/discussion.dto";
import { AuthenticatedRequest } from "@/common/types/request.types";
import { PaginationQueryDto } from "@/common/dto/base.dto";

@Controller("discussion")
export class DiscussionController {
  constructor(private readonly discussionService: DiscussionService) {}

  /** List threads for a course */
  @Get("courses/:courseUuid/threads")
  getThreads(
    @Param("courseUuid") courseUuid: string,
    @Req() req: AuthenticatedRequest,
    @Query() query: PaginationQueryDto,
  ) {
    return this.discussionService.getThreads(
      courseUuid,
      req.user.id,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  /** Get a single thread with all replies */
  @Get("threads/:threadUuid")
  getThread(@Param("threadUuid") threadUuid: string) {
    return this.discussionService.getThread(threadUuid);
  }

  /** Create a thread */
  @Post("courses/:courseUuid/threads")
  createThread(
    @Param("courseUuid") courseUuid: string,
    @Body() dto: CreateThreadDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.discussionService.createThread(
      courseUuid,
      req.user.id,
      dto.title,
      dto.content,
    );
  }

  /** Delete a thread (owner or teacher) */
  @Delete("threads/:threadUuid")
  deleteThread(
    @Param("threadUuid") threadUuid: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.discussionService.deleteThread(
      threadUuid,
      req.user.id,
      req.user.role,
    );
  }

  /** Pin / unpin a thread (teacher) */
  @Patch("threads/:threadUuid/pin")
  pinThread(
    @Param("threadUuid") threadUuid: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.discussionService.pinThread(threadUuid, req.user.id);
  }

  /** Reply to a thread */
  @Post("threads/:threadUuid/replies")
  createReply(
    @Param("threadUuid") threadUuid: string,
    @Body() dto: CreateReplyDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.discussionService.createReply(
      threadUuid,
      req.user.id,
      dto.content,
    );
  }

  /** Delete a reply (owner or teacher) */
  @Delete("replies/:replyUuid")
  deleteReply(
    @Param("replyUuid") replyUuid: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.discussionService.deleteReply(
      replyUuid,
      req.user.id,
      req.user.role,
    );
  }
}
