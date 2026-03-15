export function userInviteEmailTemplate(data: {
  firstName: string;
  inviteLink: string;
  expiresIn: string;
}) {
  return {
    subject: "You're invited to ThinkBloom LMS",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>You're Invited - ThinkBloom</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .email-content { padding: 32px 24px !important; }
      .email-header { padding-bottom: 24px !important; }
      .email-footer-content { padding: 20px 24px !important; }
      .heading { font-size: 24px !important; }
      .body-text { font-size: 15px !important; }
      .cta-button { padding: 14px 32px !important; font-size: 15px !important; }
      .footer-links a { display: block !important; margin: 8px 0 !important; }
      .footer-links span { display: none !important; }
    }
    @media only screen and (max-width: 400px) {
      .email-content { padding: 24px 16px !important; }
      .heading { font-size: 22px !important; }
      .cta-button { padding: 12px 24px !important; font-size: 14px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6f9;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" class="email-container" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td align="center" class="email-header" style="padding-bottom: 32px;">
              <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 20px 32px; border-radius: 12px; display: inline-block;">
                <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">🎓 ThinkBloom</h1>
                <p style="margin: 4px 0 0; font-size: 12px; color: #c4b5fd;">AI-Powered Learning Platform</p>
              </div>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);">
                <tr>
                  <td class="email-content" style="padding: 48px 40px;">

                    <!-- Title -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="padding-bottom: 24px;">
                          <h1 class="heading" style="margin: 0; font-size: 28px; font-weight: 700; color: #0f172a; line-height: 1.3;">You're Invited!</h1>
                        </td>
                      </tr>
                    </table>

                    <!-- Greeting -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-bottom: 24px;">
                          <p style="margin: 0; font-size: 16px; color: #334155; line-height: 1.6;">Hello <strong style="color: #4f46e5;">${data.firstName}</strong>,</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Description -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-bottom: 32px;">
                          <p class="body-text" style="margin: 0; font-size: 16px; color: #64748b; line-height: 1.6;">You've been invited to join <strong style="color: #0f172a;">ThinkBloom LMS</strong> — an AI-powered online learning platform. Click the button below to accept your invitation and get started.</p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="padding-bottom: 32px;">
                          <a href="${data.inviteLink}" class="cta-button" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px; box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.4);">
                            Accept Invitation →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Expiry Notice -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #4f46e5; padding: 16px 20px; border-radius: 8px;">
                          <p style="margin: 0; font-size: 14px; color: #1e40af; line-height: 1.6;">
                            <span style="font-size: 16px; margin-right: 8px; display: inline-block; vertical-align: middle;">⏰</span>
                            <span style="display: inline-block; vertical-align: middle;">This invitation link will expire in <strong>${data.expiresIn}</strong></span>
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Safety Notice -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 16px;">
                      <tr>
                        <td style="padding-top: 16px;">
                          <p style="margin: 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">If you didn't expect this invitation, you can safely ignore this email. No further action is required.</p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Sign Off -->
                <tr>
                  <td class="email-footer-content" style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 40px; border-radius: 0 0 16px 16px;">
                    <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">
                      Best regards,<br>
                      <strong style="color: #334155;">The ThinkBloom Team</strong>
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 12px 0; font-size: 12px; color: #94a3b8;">
                      © ${new Date().getFullYear()} ThinkBloom LMS. All rights reserved.
                    </p>
                    <p class="footer-links" style="margin: 0; font-size: 12px; color: #94a3b8;">
                      <a href="#" style="color: #4f46e5; text-decoration: none;">Privacy Policy</a>
                      <span style="padding: 0 8px;">•</span>
                      <a href="#" style="color: #4f46e5; text-decoration: none;">Terms of Service</a>
                      <span style="padding: 0 8px;">•</span>
                      <a href="#" style="color: #4f46e5; text-decoration: none;">Contact Support</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Fallback Link -->
          <tr>
            <td style="padding-top: 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.6;">
                      Having trouble with the button? Copy and paste this link into your browser:<br>
                      <span style="word-break: break-all; display: inline-block; margin-top: 4px;">${data.inviteLink}</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}
