export function courseNoteUploadedEmailTemplate(data: {
  studentName: string;
  courseTitle: string;
  noteTitle: string;
  courseLink: string;
}): { subject: string; html: string } {
  return {
    subject: `New Resource: "${data.noteTitle}" — ${data.courseTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:28px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">📎 New Resource Added</h1>
          <p style="margin:6px 0 0;color:#ede9fe;font-size:14px;">${data.courseTitle}</p>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi <strong>${data.studentName}</strong>,</p>
          <p style="margin:0 0 16px;color:#6b7280;font-size:14px;">Your teacher has uploaded a new resource for the course <strong>${data.courseTitle}</strong>.</p>
          <div style="background:#f5f3ff;border-left:4px solid #7c3aed;border-radius:4px;padding:14px 16px;margin:0 0 24px;">
            <p style="margin:0;color:#5b21b6;font-size:14px;font-weight:600;">📄 ${data.noteTitle}</p>
          </div>
          <a href="${data.courseLink}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">View Resource</a>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">ThinkBloom LMS — keep learning!</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}
