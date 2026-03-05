import { Injectable } from "@nestjs/common";
import { userInviteEmailTemplate } from "./templates/verification-email";
import { EmailChannel } from "./channel/email.channel";
import { TokenType } from "@thinkbloom/data-sources";
import { forgotPasswordEmailTemplate } from "./templates/forgot-password";
import { enrollmentConfirmationEmailTemplate } from "./templates/enrollment-confirmation";
import { quizCompletedEmailTemplate } from "./templates/quiz-completed";
import { videoProcessedEmailTemplate } from "./templates/video-processed";

@Injectable()
export class NotificationService {
  constructor(private readonly emailChannel: EmailChannel) {}

  // ─── Password Reset ───────────────────────────────────────────────────────

  async sendUserPasswordResetNotification(data: any) {
    const { name, token, email, type } = data;

    let link: string;
    let template: any;
    if (type === TokenType.PASSWORD_RESET) {
      link =
        process.env.FRONTEND_URL +
        "/auth/forgot-password?token=" +
        token +
        "&email=" +
        email;
      template = forgotPasswordEmailTemplate;
    } else {
      link =
        process.env.FRONTEND_URL + "/set-password/" + token + "?email=" + email;
      template = userInviteEmailTemplate;
    }

    const payload = { firstName: name, link, expiresIn: "1 day" };
    const content = template(payload);

    await this.emailChannel.send({
      to: email,
      subject: content.subject,
      html: content.html,
      from: process.env.EMAIL_FROM,
      replyTo: "support@thinkbloom.ai",
    });
  }

  // ─── Enrollment Confirmation ──────────────────────────────────────────────

  async sendEnrollmentConfirmation(data: {
    studentName: string;
    studentEmail: string;
    courseTitle: string;
    courseUuid: string;
  }) {
    const courseLink = `${process.env.FRONTEND_URL}/student/courses/${data.courseUuid}`;
    const content = enrollmentConfirmationEmailTemplate({
      studentName: data.studentName,
      courseTitle: data.courseTitle,
      courseLink,
    });

    await this.emailChannel.send({
      to: data.studentEmail,
      subject: content.subject,
      html: content.html,
      from: process.env.EMAIL_FROM,
      replyTo: "support@thinkbloom.ai",
    });
  }

  // ─── Quiz Completed ────────────────────────────────────────────────────────

  async sendQuizCompleted(data: {
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
    const content = quizCompletedEmailTemplate(data);

    await this.emailChannel.send({
      to: data.studentEmail,
      subject: content.subject,
      html: content.html,
      from: process.env.EMAIL_FROM,
      replyTo: "support@thinkbloom.ai",
    });
  }

  // ─── Video Processed ──────────────────────────────────────────────────────

  async sendVideoProcessed(data: {
    teacherName: string;
    teacherEmail: string;
    lessonTitle: string;
    courseTitle: string;
    courseUuid: string;
    lessonId: number;
    fileName: string;
    fileSize: string;
  }) {
    const lessonLink = `${process.env.FRONTEND_URL}/teacher/courses/${data.courseUuid}/lessons/${data.lessonId}/edit`;
    const content = videoProcessedEmailTemplate({
      teacherName: data.teacherName,
      lessonTitle: data.lessonTitle,
      courseTitle: data.courseTitle,
      fileName: data.fileName,
      fileSize: data.fileSize,
      lessonLink,
    });

    await this.emailChannel.send({
      to: data.teacherEmail,
      subject: content.subject,
      html: content.html,
      from: process.env.EMAIL_FROM,
      replyTo: "support@thinkbloom.ai",
    });
  }

  // ─── OTP ──────────────────────────────────────────────────────────────────

  async sentOtp(email: string, otp: string) {
    await this.emailChannel.send({
      to: email,
      subject: "2FA Verification Code — ThinkBloom",
      html: `<p>Your verification code is: <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
      from: process.env.EMAIL_FROM,
      replyTo: "support@thinkbloom.ai",
    });
  }
}
