"use server";
import { transporter } from "@/lib/mailer";

export async function sendInvitationEmail(
  toEmail: string,
  inviteLink: string,
  messName: string,
  inviterName: string
) {
  await transporter.sendMail({
    from: `"Mess Manager" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `${inviterName} invited you to join ${messName}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mess Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #9FD5A3 0%, #7CB380 100%); padding: 40px 30px; text-align: center;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <div style="background-color: rgba(255, 255, 255, 0.2); width: 64px; height: 64px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                     <svg width="40" height="40" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#2c5384;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0d1b31;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="iconGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#b8e994;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#78ac5d;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="800" height="800" rx="120" fill="url(#bgGradient)"/>
  
  <g fill="url(#iconGradient)">
    <path d="M190 150 V280 C190 450 220 500 360 680 H440 C580 500 610 450 610 280 V150" stroke="none" opacity="0.9"/>
    
    <path d="M360 180 L400 350 L440 180 H500 L420 480 V680 H380 V480 L300 180 H360Z" />
    
    <ellipse cx="610" cy="220" rx="60" ry="90" />
    
    <rect x="190" y="100" width="15" height="80" rx="5" />
    <rect x="220" y="100" width="15" height="80" rx="5" />
    <rect x="250" y="100" width="15" height="80" rx="5" />
    
    <path d="M330 550 L400 480 L480 530 L560 420" stroke="url(#iconGradient)" stroke-width="25" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    <path d="M530 420 H565 V455" stroke="url(#iconGradient)" stroke-width="25" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    
    <rect x="375" y="580" width="25" height="80" rx="2" />
    <rect x="410" y="540" width="25" height="120" rx="2" />
    <rect x="445" y="590" width="25" height="70" rx="2" />
  </g>
</svg>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Mess Manager</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                      You're Invited! 🎉
                    </h2>
                    <p style="margin: 0 0 24px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                      <strong style="color: #1a1a1a;">${inviterName}</strong> has invited you to join <strong style="color: #1a1a1a;">${messName}</strong> on Mess Manager.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Features Box -->
              <table role="presentation" style="width: 100%; margin: 24px 0;">
                <tr>
                  <td style="background-color: #f8fafb; border-radius: 12px; padding: 24px;">
                    <p style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">
                      What you can do:
                    </p>
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 8px 0;">
                          <table role="presentation">
                            <tr>
                              <td style="padding-right: 12px; vertical-align: top;">
                                <span style="color: #9FD5A3; font-size: 18px;">✓</span>
                              </td>
                              <td>
                                <span style="color: #666666; font-size: 14px;">Track your daily meals and expenses</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <table role="presentation">
                            <tr>
                              <td style="padding-right: 12px; vertical-align: top;">
                                <span style="color: #9FD5A3; font-size: 18px;">✓</span>
                              </td>
                              <td>
                                <span style="color: #666666; font-size: 14px;">View your balance and payment history</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <table role="presentation">
                            <tr>
                              <td style="padding-right: 12px; vertical-align: top;">
                                <span style="color: #9FD5A3; font-size: 18px;">✓</span>
                              </td>
                              <td>
                                <span style="color: #666666; font-size: 14px;">Get notified for due payments</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 32px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation">
                      <tr>
                        <td style="border-radius: 12px; background-color: #9FD5A3;">
                          <a href="${inviteLink}" style="display: inline-block; padding: 16px 48px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px;">
                            Accept Invitation →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <table role="presentation" style="width: 100%; margin: 24px 0;">
                <tr>
                  <td style="background-color: #fff8e6; border-left: 4px solid #ffa726; padding: 16px; border-radius: 8px;">
                    <p style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 13px; font-weight: 600;">
                      Button not working?
                    </p>
                    <p style="margin: 0; color: #666666; font-size: 13px; line-height: 1.5;">
                      Copy and paste this link into your browser:
                    </p>
                    <p style="margin: 8px 0 0 0; color: #1a1a1a; font-size: 12px; word-break: break-all; font-family: monospace; background-color: #ffffff; padding: 8px; border-radius: 4px;">
                      ${inviteLink}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Expiry Notice -->
              <table role="presentation" style="width: 100%; margin: 24px 0;">
                <tr>
                  <td align="center">
                    <p style="margin: 0; color: #999999; font-size: 13px;">
                      ⏰ This invitation expires in <strong>24 hours</strong>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafb; padding: 24px 30px; border-top: 1px solid #e5e5e5;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 12px 0; color: #999999; font-size: 12px;">
                      This invitation was sent to <strong>${toEmail}</strong>
                    </p>
                    <p style="margin: 0; color: #999999; font-size: 12px;">
                      © ${new Date().getFullYear()} Mess Manager. All rights reserved.
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
    text: `
You're Invited to Join ${messName}!

${inviterName} has invited you to join ${messName} on Mess Manager.

What you can do:
• Track your daily meals and expenses
• View your balance and payment history
• Get notified for due payments

Accept your invitation by clicking this link:
${inviteLink}

If the link doesn't work, copy and paste it into your browser.

This invitation expires in 24 hours.

---
This invitation was sent to ${toEmail}
© ${new Date().getFullYear()} Mess Manager. All rights reserved.
    `,
  });
}
