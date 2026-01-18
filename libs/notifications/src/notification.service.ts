import { Injectable } from "@nestjs/common";
import { userInviteEmailTemplate } from "./templates/verification-email";
import { EmailChannel } from "./channel/email.channel";
import { TokenType } from "@thinkbloom/data-sources";
import { forgotPasswordEmailTemplate } from "./templates/forgot-password";

@Injectable()
export class NotificationService {
  constructor(private readonly emailChannel: EmailChannel) {}
  async sendUserPasswordResetNotification(data: any) {
    const { userId, name, token, email, type } = data;

    let link: string;
    let template: any;
    if (type === TokenType.PASSWORD_RESET) {
      link =
        process.env.FRONTEND_URL +
        "/reset-password/" +
        token +
        "?email=" +
        email;
      template = forgotPasswordEmailTemplate;

    } else {
      link =
        process.env.FRONTEND_URL + "/set-password/" + token + "?email=" + email;
      template = userInviteEmailTemplate;
    }

    const payload = {
      firstName: name,
      link: link,
      expiresIn: "1 day",
    };
    const content = template(payload);

    await this.emailChannel.send({
      to: email,
      subject: content.subject,
      html: content.html,
      from: process.env.EMAIL_FROM,
      replyTo: "support@mailinator.com",
    });
  }

  async sentOtp(email: string, otp: string) {
    await this.emailChannel.send({
      to: email,
      subject: "2FA Verification Code",
      html: `Your 2FA verification code is: ${otp}`,
      from: process.env.EMAIL_FROM,
      replyTo: "support@mailinator.com",
    });
  }
}
