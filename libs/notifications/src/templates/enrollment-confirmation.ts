export const enrollmentConfirmationEmailTemplate = (data: {
  studentName: string;
  courseTitle: string;
  courseLink: string;
}) => ({
  subject: `You're enrolled in "${data.courseTitle}" — ThinkBloom`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Enrollment Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">🎓 ThinkBloom</h1>
            <p style="margin:8px 0 0;color:#c4b5fd;font-size:14px;">AI-Powered Learning</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:700;">You're in! Welcome to the course 🎉</h2>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">Hi <strong style="color:#111827;">${data.studentName}</strong>,</p>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
              You've successfully enrolled in <strong style="color:#4f46e5;">${data.courseTitle}</strong>.
              Your learning journey starts now!
            </p>
            <div style="background:#f5f3ff;border-left:4px solid #4f46e5;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 28px;">
              <p style="margin:0;color:#5b21b6;font-size:14px;font-weight:600;">📚 Course: ${data.courseTitle}</p>
            </div>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr>
                <td style="background:#4f46e5;border-radius:8px;padding:14px 28px;">
                  <a href="${data.courseLink}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">Start Learning →</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">
              Use the AI chatbot to ask questions, generate notes, and take quizzes as you learn. Good luck!
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:13px;">© 2025 ThinkBloom LMS. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
});
