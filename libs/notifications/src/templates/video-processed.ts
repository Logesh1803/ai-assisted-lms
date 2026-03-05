export const videoProcessedEmailTemplate = (data: {
  teacherName: string;
  lessonTitle: string;
  courseTitle: string;
  fileName: string;
  fileSize: string;
  lessonLink: string;
}) => ({
  subject: `✅ Video uploaded — "${data.lessonTitle}" is ready`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Video Upload Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">🎓 ThinkBloom</h1>
            <p style="margin:8px 0 0;color:#c4b5fd;font-size:14px;">Video Upload Confirmed</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:700;">Video upload successful ✅</h2>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">Hi <strong style="color:#111827;">${data.teacherName}</strong>,</p>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
              Your video has been successfully uploaded and is now available for students in your course.
            </p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px 24px;margin:0 0 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;">
                    <span style="color:#6b7280;font-size:13px;width:120px;display:inline-block;">📚 Course</span>
                    <strong style="color:#111827;font-size:14px;">${data.courseTitle}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;">
                    <span style="color:#6b7280;font-size:13px;width:120px;display:inline-block;">🎬 Lesson</span>
                    <strong style="color:#111827;font-size:14px;">${data.lessonTitle}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;">
                    <span style="color:#6b7280;font-size:13px;width:120px;display:inline-block;">📁 File</span>
                    <span style="color:#374151;font-size:14px;">${data.fileName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;">
                    <span style="color:#6b7280;font-size:13px;width:120px;display:inline-block;">💾 Size</span>
                    <span style="color:#374151;font-size:14px;">${data.fileSize}</span>
                  </td>
                </tr>
              </table>
            </div>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr>
                <td style="background:#4f46e5;border-radius:8px;padding:14px 28px;">
                  <a href="${data.lessonLink}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">View Lesson →</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">
              Students can now watch the video, generate AI notes, and take quizzes on this lesson.
            </p>
          </td>
        </tr>
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
