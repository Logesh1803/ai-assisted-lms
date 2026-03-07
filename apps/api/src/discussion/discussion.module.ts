import { Module } from '@nestjs/common';
import { DiscussionService } from './discussion.service';
import { DiscussionController } from './discussion.controller';
import { SystemsDatabaseModule } from '@thinkbloom/data-sources';

@Module({
  imports: [SystemsDatabaseModule],
  controllers: [DiscussionController],
  providers: [DiscussionService],
})
export class DiscussionModule {}
