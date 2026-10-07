import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { NotificationProducerService } from "@thinkbloom/message-queues";
import { UserTokenData } from "@/user/interfaces/user.interfaces";

@Injectable()
export class UserListener {
  private readonly logger = new Logger(UserListener.name);

  constructor(private notificationService: NotificationProducerService) {}

  /**
   * AuthService emits the token details as a flat object, so that is what
   * arrives here. It was previously typed as `UserEvent`, which wraps the same
   * details in a `userTokenData` property — a shape this event never carries.
   */
  @OnEvent("user.password.reset")
  async handleUserTokenEvent(userTokenData: UserTokenData) {
    this.logger.log(`Queueing password reset email for ${userTokenData.email}`);
    await this.notificationService.dispatachUserPasswordResetNotification(
      userTokenData,
    );
  }
}
