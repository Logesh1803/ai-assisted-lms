export function forgotPasswordEmailTemplate(data: {
  firstName: string;
  resetLink: string;
  expiresIn: string;
  domain:string
}) {
  return {
    subject: "Reset Your Password - Thinkbloom",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Reset Password - Samera.ai</title>
  <style>
    /* Responsive styles */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }
      .email-content {
        padding: 32px 24px !important;
      }
      .email-header {
        padding-bottom: 24px !important;
      }
      .email-footer-content {
        padding: 20px 24px !important;
      }
      .heading {
        font-size: 24px !important;
      }
      .body-text {
        font-size: 15px !important;
      }
      .cta-button {
        padding: 14px 32px !important;
        font-size: 15px !important;
      }
      .footer-links a {
        display: block !important;
        margin: 8px 0 !important;
      }
      .footer-links span {
        display: none !important;
      }
    }
    
    @media only screen and (max-width: 400px) {
      .email-content {
        padding: 24px 16px !important;
      }
      .heading {
        font-size: 22px !important;
      }
      .cta-button {
        padding: 12px 24px !important;
        font-size: 14px !important;
      }
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
              <div style="background: #0a0a0a; padding: 20px; border-radius: 12px; display: inline-block;">
                <h5 style="font-size: 20px; color: blueviolet">Thinkbloom</h5>
                
              </div>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td class="email-content" style="padding: 48px 40px;">
                    
                    <!-- Title -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="padding-bottom: 24px;">
                          <h1 class="heading" style="margin: 0; font-size: 28px; font-weight: 700; color: #0f172a; line-height: 1.3;">🔑 Reset Your Password</h1>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Greeting -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-bottom: 24px;">
                          <p style="margin: 0; font-size: 16px; color: #334155; line-height: 1.6;">Hello <strong style="color: #3b82f6;">${data.firstName}</strong>, 👋</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Description -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-bottom: 32px;">
                          <p class="body-text" style="margin: 0; font-size: 16px; color: #64748b; line-height: 1.6;">We received a request to reset your password for your <strong style="color: #0f172a;">Samera</strong> account. Click the button below to create a new password.</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="padding-bottom: 32px;">
                          <a href="${data.resetLink}" class="cta-button" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px; box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.4);">
                            Reset Password →
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Expiry Notice -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
                          <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.6;">
                            <span style="font-size: 18px; margin-right: 8px; display: inline-block; vertical-align: middle;">⏰</span>
                            <span style="display: inline-block; vertical-align: middle;">This password reset link will expire in <strong>${data.expiresIn}</strong></span>
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Security Notice -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-left: 4px solid #ef4444; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
                          <p style="margin: 0; font-size: 14px; color: #7f1d1d; line-height: 1.6;">
                            <span style="font-size: 18px; margin-right: 8px; display: inline-block; vertical-align: middle;">🛡️</span>
                            <span style="display: inline-block; vertical-align: middle;"><strong>Security Tip:</strong> If you didn't request a password reset, please contact our support team immediately.</span>
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Safety Notice -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-top: 16px;">
                          <p style="margin: 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
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
                      <strong style="color: #334155;">The Samera Team</strong>
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
                      © ${new Date().getFullYear()} Samera. All rights reserved.
                    </p>
                    <p class="footer-links" style="margin: 0; font-size: 12px; color: #94a3b8;">
                      <a href="#" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a>
                      <span style="padding: 0 8px;">•</span>
                      <a href="#" style="color: #3b82f6; text-decoration: none;">Terms of Service</a>
                      <span style="padding: 0 8px;">•</span>
                      <a href="#" style="color: #3b82f6; text-decoration: none;">Contact Support</a>
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
                      Having trouble? Copy and paste this link into your browser:<br>
                      <span style="word-break: break-all; display: inline-block; margin-top: 4px;">${data.resetLink}</span>
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
