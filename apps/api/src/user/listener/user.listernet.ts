import {Injectable} from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import {NotificationProducerService} from "message-queues/src";
import {UserEvent} from "@/user/event/user.event";



@Injectable()
export class UserListener {
  constructor(private notificationService:NotificationProducerService) {}
  @OnEvent("user.password.reset")
  @OnEvent("user.created")
  async handleUserCreatedEvent(event: UserEvent) {
    const userTokenData = event;
    console.log("user rest")
    await this.notificationService.dispatachUserPasswordResetNotification(
      userTokenData,
    );
  }
}
