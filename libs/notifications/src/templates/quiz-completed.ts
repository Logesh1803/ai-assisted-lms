export const quizCompletedEmailTemplate = (data: {
  studentName: string;
  courseTitle: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  strongTopics: string[];
  weakTopics: string[];
  aiFeedback?: string;
}) => {
  const scoreColor = data.score >= 70 ? '#16a34a' : data.score >= 50 ? '#d97706' : '#dc2626';
  const scoreEmoji = data.score >= 70 ? '🏆' : data.score >= 50 ? '👍' : '📚';
  const strongTopicsHtml = data.strongTopics.length
    ? data.strongTopics.map(t => `<span style="background:#dcfce7;color:#166534;padding:3px 10px;border-radius:20px;font-size:12px;margin:2px;display:inline-block;">${t}</span>`).join(' ')
    : '<span style="color:#9ca3af;font-size:13px;">None identified</span>';
  const weakTopicsHtml = data.weakTopics.length
    ? data.weakTopics.map(t => `<span style="background:#fee2e2;color:#991b1b;padding:3px 10px;border-radius:20px;font-size:12px;margin:2px;display:inline-block;">${t}</span>`).join(' ')
    : '<span style="color:#9ca3af;font-size:13px;">None identified</span>';

  return {
    subject: `${scoreEmoji} Quiz Result: ${data.score}% — ${data.courseTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Quiz Result</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">🎓 ThinkBloom</h1>
            <p style="margin:8px 0 0;color:#c4b5fd;font-size:14px;">Quiz Results</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 16px;color:#6b7280;font-size:15px;">Hi <strong style="color:#111827;">${data.studentName}</strong>,</p>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
              You've completed a quiz in <strong style="color:#4f46e5;">${data.courseTitle}</strong>. Here are your results:
            </p>
            <!-- Score Card -->
            <div style="background:#f5f3ff;border-radius:12px;padding:28px;text-align:center;margin:0 0 28px;">
              <div style="font-size:56px;font-weight:800;color:${scoreColor};">${data.score}%</div>
              <div style="color:#6b7280;font-size:14px;margin-top:8px;">
                ${data.correctAnswers} correct out of ${data.totalQuestions} questions
              </div>
            </div>
            <!-- Topics -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td width="48%" style="vertical-align:top;padding-right:8px;">
                  <div style="background:#f0fdf4;border-radius:8px;padding:16px;">
                    <p style="margin:0 0 10px;color:#166534;font-weight:600;font-size:13px;">✅ Strong Topics</p>
                    <div>${strongTopicsHtml}</div>
                  </div>
                </td>
                <td width="4%"></td>
                <td width="48%" style="vertical-align:top;padding-left:8px;">
                  <div style="background:#fef2f2;border-radius:8px;padding:16px;">
                    <p style="margin:0 0 10px;color:#991b1b;font-weight:600;font-size:13px;">📌 Needs Improvement</p>
                    <div>${weakTopicsHtml}</div>
                  </div>
                </td>
              </tr>
            </table>
            ${data.aiFeedback ? `
            <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 24px;">
              <p style="margin:0 0 8px;color:#92400e;font-weight:600;font-size:13px;">🤖 AI Feedback</p>
              <p style="margin:0;color:#78350f;font-size:14px;line-height:1.6;">${data.aiFeedback}</p>
            </div>` : ''}
            <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">
              Keep learning and take more quizzes to reinforce your knowledge!
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
  };
};
