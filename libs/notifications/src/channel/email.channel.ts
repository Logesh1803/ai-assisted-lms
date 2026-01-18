import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailPayload } from '../interfaces/email.interface';

@Injectable()
export class EmailChannel {
  private readonly logger = new Logger(EmailChannel.name);

  async send(payload: EmailPayload): Promise<void> {
    try {
      this.logger.log(
        `Sending email to ${payload.to} | subject="${payload.subject}"`,
      );
      this.logger.debug(`checking environment variables... ${process.env.SMTP_HOST}`);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });


      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        replyTo: payload.replyTo,
      });


      this.logger.log(`Email sent to ${payload.to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${payload.to}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
