import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// ── Transporter Setup ─────────────────────────────────────────────────────────

function createSmtpTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : undefined;

  if (user && pass) {
    if (host?.includes('gmail') || user.endsWith('@gmail.com')) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    }

    if (host) {
      return nodemailer.createTransport({
        host,
        port,
        secure: process.env.SMTP_SECURE === 'true' || port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      });
    }
  }
  return null;
}

const FROM_EMAIL = process.env.SMTP_FROM || (process.env.SMTP_USER ? `CanaFri <${process.env.SMTP_USER}>` : undefined) || process.env.SES_FROM_EMAIL || 'CanaFri Support <no-reply@canafri.com>';
const SUPPORT_NOTIFY_EMAIL = process.env.SUPPORT_NOTIFY_EMAIL || 'team@canafri.io';

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Core sendEmail Helper ──────────────────────────────────────────────────────

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  // 1. Attempt SMTP (Nodemailer) first if configured
  const smtpTransporter = createSmtpTransporter();
  if (smtpTransporter) {
    try {
      await smtpTransporter.sendMail({
        from: FROM_EMAIL,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });
      console.log(`[EmailService] Successfully sent email to ${params.to} via SMTP (${process.env.SMTP_HOST}).`);
      return true;
    } catch (err: any) {
      console.error(`[EmailService] SMTP email dispatch failed to ${params.to}:`, err.message || err);
      console.log(`[MOCK EMAIL FALLBACK] Target: ${params.to} | Subject: ${params.subject}\nContent:\n${params.text}`);
    }
  }

  // 2. Attempt AWS SES if configured
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  if (accessKey && accessKey !== 'your_aws_access_key_id') {
    try {
      const sesClient = new SESClient({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
      });
      const command = new SendEmailCommand({
        Source: FROM_EMAIL,
        Destination: { ToAddresses: [params.to] },
        Message: {
          Subject: { Data: params.subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: params.html, Charset: 'UTF-8' },
            Text: { Data: params.text, Charset: 'UTF-8' },
          },
        },
      });
      await sesClient.send(command);
      console.log(`[EmailService] Successfully sent email to ${params.to} via AWS SES.`);
      return true;
    } catch (err: any) {
      console.error(`[EmailService] AWS SES email dispatch failed:`, err.message || err);
    }
  }

  // 3. Terminal mock fallback (if SMTP & SES are not set or failed)
  if (!smtpTransporter && (!accessKey || accessKey === 'your_aws_access_key_id')) {
    console.log(`[MOCK EMAIL FALLBACK] Target: ${params.to} | Subject: ${params.subject}\nContent:\n${params.text}`);
  }

  return false;
}

// ── Email Templates & Public Helpers ──────────────────────────────────────────

/**
 * Sends Verification OTP Email (used for Registration, Resend OTP, Password Reset)
 */
export async function sendOtpEmail(
  to: string,
  otp: string,
  purpose: 'registration' | 'forgot_password' | 'verification' = 'registration',
  name?: string
): Promise<void> {
  const isForgot = purpose === 'forgot_password';
  const heading = isForgot ? 'Reset your password' : 'Verify your email address';
  const explanation = isForgot
    ? 'Please use the verification code below to reset your password and regain access to your account.'
    : 'Thank you for getting started with CanaFri. Please use the verification code below to confirm your email address and continue creating your account.';
  const ignoreNotice = isForgot
    ? 'If you did not request a password reset, you can safely ignore this email.'
    : 'If you did not create this account, you can safely ignore this email.';

  const firstName = name?.trim() ? name.trim().split(' ')[0] : null;
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';

  const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'https://canafri.com';

  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark light" />
  <meta name="supported-color-schemes" content="dark light" />
  <title>${heading}</title>
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    a {
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .content-padding {
        padding: 28px 20px !important;
      }
      .header-padding {
        padding: 24px 20px 20px 20px !important;
      }
      .otp-code {
        font-size: 32px !important;
        letter-spacing: 6px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #070709; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Outer Wrapper Table -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #070709; width: 100%; margin: 0; padding: 40px 12px;">
    <tr>
      <td align="center" style="padding: 0;">
        
        <!-- Main Email Container (Max Width 580px, Borderless) -->
        <table role="presentation" class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; width: 100%; background-color: #0d0d11; border: none; margin: 0 auto; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);">
          
          <!-- Top Nav / Header: Logo + Name on Left, Social Icons on Right, Bottom Border Line -->
          <tr>
            <td class="header-padding" style="padding: 28px 40px 22px 40px; background-color: #0d0d11; border-bottom: 1px solid #1c1c24;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Left: Brand Logo + CanaFri Wordmark -->
                  <td align="left" valign="middle">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle" style="padding-right: 12px;">
                          <img src="https://www.svgrepo.com/show/366856/agi.svg" alt="CanaFri" width="34" height="34" style="display: block; width: 34px; height: 34px; border: 0; outline: none;" />
                        </td>
                        <td valign="middle">
                          <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; line-height: 1;">canafri</span>
                        </td>
                      </tr>
                    </table>
                  </td>

                  <!-- Right: Social Media Icons (Round 50% Border Stroke) -->
                  <td align="right" valign="middle">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="right">
                      <tr>
                        <!-- Telegram Round Button (50% Radius) -->
                        <td style="padding-right: 10px;" valign="middle">
                          <a href="https://t.me/canafri" target="_blank" style="text-decoration: none; display: inline-block;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 36px; height: 36px; border-radius: 50%; -webkit-border-radius: 50%; -moz-border-radius: 50%; background-color: #141418; border: 1px solid #282832; border-collapse: separate; overflow: hidden;">
                              <tr>
                                <td align="center" valign="middle" style="width: 36px; height: 36px; padding: 0; border-radius: 50%; -webkit-border-radius: 50%;">
                                  <img src="https://cdn-icons-png.flaticon.com/512/2111/2111646.png" alt="Telegram" width="21" height="21" style="display: block; width: 21px; height: 21px; border: 0; outline: none; margin: 0 auto; opacity: 0.9;" />
                                </td>
                              </tr>
                            </table>
                          </a>
                        </td>

                        <!-- X / Twitter Round Button (50% Radius) -->
                        <td valign="middle">
                          <a href="https://x.com/canafri" target="_blank" style="text-decoration: none; display: inline-block;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 36px; height: 36px; border-radius: 50%; -webkit-border-radius: 50%; -moz-border-radius: 50%; background-color: #141418; border: 1px solid #282832; border-collapse: separate; overflow: hidden;">
                              <tr>
                                <td align="center" valign="middle" style="width: 36px; height: 36px; padding: 0; border-radius: 50%; -webkit-border-radius: 50%;">
                                  <img src="https://cdn-icons-png.flaticon.com/512/5969/5969020.png" alt="X" width="19" height="19" style="display: block; width: 19px; height: 19px; border: 0; outline: none; margin: 0 auto; opacity: 0.9;" />
                                </td>
                              </tr>
                            </table>
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Section -->
          <tr>
            <td class="content-padding" style="padding: 36px 40px 36px 40px; background-color: #0d0d11;">
              
              <!-- Refined Heading (Sleek Font Size) -->
              <h1 style="margin: 0 0 20px 0; font-size: 21px; font-weight: 700; line-height: 28px; letter-spacing: -0.3px; color: #ffffff; text-align: left;">
                ${heading}
              </h1>

              <!-- Dynamic Personalized Greeting -->
              <p style="margin: 0 0 14px 0; font-size: 15px; font-weight: 500; line-height: 24px; color: #e4e4e7; text-align: left;">
                ${greeting}
              </p>

              <!-- Explanation -->
              <p style="margin: 0 0 28px 0; font-size: 14px; font-weight: 400; line-height: 22px; color: #a1a1aa; text-align: left;">
                ${explanation}
              </p>

              <!-- Verification Code Label (Outside & Above Container) -->
              <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: #8C5CFF; text-align: center;">
                Verification code
              </p>

              <!-- Verification Code Container (Contains ONLY the code, Borderless #121212 Card) -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 16px 0;">
                <tr>
                  <td align="center" style="background-color: #121212; border: none; padding: 24px 20px;">
                    <div class="otp-code" style="font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #ffffff; line-height: 46px; margin: 0; text-align: center; text-indent: 8px;">
                      ${otp}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Expiration Notice (Outside & Below Container) -->
              <p style="margin: 0 0 16px 0; font-size: 12px; font-weight: 400; color: #71717a; line-height: 18px; text-align: center;">
                This code will expire in 10 minutes.
              </p>

              <!-- Safety Note -->
              <p style="margin: 0 0 32px 0; font-size: 13px; font-weight: 400; line-height: 20px; color: #71717a; text-align: left;">
                ${ignoreNotice}
              </p>

              <!-- Subtle Minimal Divider 1 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td style="border-top: 1px solid #16161a; line-height: 1px; font-size: 1px;">&nbsp;</td>
                </tr>
              </table>

              <!-- Security Information Section -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td style="text-align: left;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #e4e4e7; letter-spacing: -0.1px;">
                      Security notice
                    </p>
                    <p style="margin: 0; font-size: 13px; font-weight: 400; line-height: 20px; color: #71717a;">
                      CanaFri will never ask you to share your password, verification code, or other sensitive account information through email.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Subtle Minimal Divider 2 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td style="border-top: 1px solid #16161a; line-height: 1px; font-size: 1px;">&nbsp;</td>
                </tr>
              </table>

              <!-- Footer Section -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="text-align: left;">
                    <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #a1a1aa;">
                      CanaFri
                    </p>
                    <p style="margin: 0 0 16px 0; font-size: 12px; font-weight: 400; color: #52525b;">
                      &copy; 2026 CanaFri
                    </p>
                    <p style="margin: 0; font-size: 12px; font-weight: 400; color: #71717a; line-height: 20px;">
                      <a href="${appUrl}/privacy" style="color: #8C5CFF; text-decoration: underline; margin-right: 14px;">Privacy Policy</a>
                      <a href="${appUrl}/terms" style="color: #8C5CFF; text-decoration: underline; margin-right: 14px;">Terms of Service</a>
                      <a href="${appUrl}/support" style="color: #8C5CFF; text-decoration: underline;">Support</a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
        <!-- End Main Email Container -->

      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `CanaFri - ${heading}\n\n${greeting}\n\n${explanation}\n\nVerification Code: ${otp}\n\nThis code will expire in 10 minutes.\n\n${ignoreNotice}\n\nSecurity Notice:\nCanaFri will never ask you to share your password, verification code, or other sensitive account information through email.\n\n(c) 2026 CanaFri`;

  await sendEmail({
    to,
    subject: `${otp} is your CanaFri verification code`,
    html,
    text,
  });
}

/**
 * Sent to the user immediately after creating a support ticket.
 * Fire-and-forget — never throws.
 */
export async function sendTicketConfirmationEmail(
  to: string,
  ticketNumber: string,
  subject: string
): Promise<void> {
  try {
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <h2 style="color:#8C5CFF">Support Request Received</h2>
        <p>We received your support request. Our team will get back to you as soon as possible.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px 0;color:#555;font-size:13px">Reference</td><td style="padding:8px 0;font-weight:600">${ticketNumber}</td></tr>
          <tr><td style="padding:8px 0;color:#555;font-size:13px">Subject</td><td style="padding:8px 0">${subject}</td></tr>
          <tr><td style="padding:8px 0;color:#555;font-size:13px">Status</td><td style="padding:8px 0"><span style="background:#8C5CFF;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px">Open</span></td></tr>
        </table>
        <p style="font-size:13px;color:#666">You can check the status of your ticket in the <strong>My Tickets</strong> section of your dashboard.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="font-size:11px;color:#aaa">This is an automated email from CanaFri Support. Please do not reply directly to this email.</p>
      </div>
    `;
    const text = `Support Request Received\n\nReference: ${ticketNumber}\nSubject: ${subject}\nStatus: Open\n\nWe received your request and will reply as soon as possible.`;
    await sendEmail({ to, subject: `[${ticketNumber}] Support Request Received — CanaFri`, html, text });
  } catch (err) {
    console.error(`[EmailService] Failed to send confirmation to ${to}:`, err);
  }
}

/**
 * Sent to support team when a new ticket is submitted.
 * Fire-and-forget — never throws.
 */
export async function notifySupportTeamNewTicket(
  ticketNumber: string,
  category: string,
  subject: string,
  userEmail: string
): Promise<void> {
  try {
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <h2 style="color:#8C5CFF">New Support Ticket — ${category}</h2>
        <p>A new support request has been submitted on CanaFri.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px 0;color:#555;font-size:13px">Ticket ID</td><td style="padding:8px 0;font-weight:600">${ticketNumber}</td></tr>
          <tr><td style="padding:8px 0;color:#555;font-size:13px">User Email</td><td style="padding:8px 0">${userEmail}</td></tr>
          <tr><td style="padding:8px 0;color:#555;font-size:13px">Category</td><td style="padding:8px 0">${category}</td></tr>
          <tr><td style="padding:8px 0;color:#555;font-size:13px">Subject</td><td style="padding:8px 0">${subject}</td></tr>
        </table>
        <p style="font-size:13px;color:#666">Please log in to the admin portal to review and respond.</p>
      </div>
    `;
    const text = `New Support Ticket\n\nID: ${ticketNumber}\nFrom: ${userEmail}\nCategory: ${category}\nSubject: ${subject}`;
    await sendEmail({ to: SUPPORT_NOTIFY_EMAIL, subject: `[${ticketNumber}] New Ticket — ${category}`, html, text });
  } catch (err) {
    console.error('[EmailService] Failed to notify support team:', err);
  }
}

/**
 * Sent to user when admin replies or changes ticket status.
 * Fire-and-forget — never throws.
 */
export async function sendAdminReplyEmail(
  to: string,
  ticketNumber: string,
  status: string,
  replyText: string,
  subject: string
): Promise<void> {
  try {
    const statusLabel = formatStatus(status);
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <h2 style="color:#8C5CFF">Update on Your Support Request</h2>
        <p>An administrator has responded to your ticket <strong>[${ticketNumber}] ${subject}</strong>.</p>
        <div style="background:#f4f4f5;border-left:4px solid #8C5CFF;padding:12px 16px;margin:16px 0;border-radius:0 8px 8px 0">
          <p style="margin:0;font-size:14px;white-space:pre-wrap">${replyText}</p>
        </div>
        <p style="font-size:13px;color:#555">Ticket Status: <strong>${statusLabel}</strong></p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="font-size:11px;color:#aaa">Automated notification from CanaFri Support System.</p>
      </div>
    `;
    const text = `Update on Support Request [${ticketNumber}]\n\nStatus: ${statusLabel}\n\nResponse:\n${replyText}`;
    await sendEmail({ to, subject: `[${ticketNumber}] Support Update — ${statusLabel}`, html, text });
  } catch (err) {
    console.error(`[EmailService] Failed to send admin reply email to ${to}:`, err);
  }
}

/**
 * Sent to the administrator when their account password is updated.
 * Fire-and-forget — never throws.
 */
export async function sendAdminPasswordChangedEmail(
  to: string,
  details: { ip: string; userAgent: string; timestamp: Date }
): Promise<void> {
  try {
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;border:1px solid #e5e7eb;border-radius:12px;padding:24px">
        <h2 style="color:#8C5CFF;margin-top:0">Security Alert: Administrator Password Changed</h2>
        <p>Your CanaFri administrator password was recently updated successfully.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f9fafb;padding:12px;border-radius:8px">
          <tr><td style="padding:6px 12px;color:#555;font-size:13px">Time (UTC)</td><td style="padding:6px 12px;font-weight:600;font-size:13px">${details.timestamp.toUTCString()}</td></tr>
          <tr><td style="padding:6px 12px;color:#555;font-size:13px">IP Address</td><td style="padding:6px 12px;font-weight:600;font-size:13px">${details.ip}</td></tr>
          <tr><td style="padding:6px 12px;color:#555;font-size:13px">Device / Browser</td><td style="padding:6px 12px;font-size:12px;color:#374151">${details.userAgent}</td></tr>
        </table>
        <p style="font-size:13px;color:#dc2626;font-weight:600">If you did NOT make this password change, your account may be compromised. Please contact support immediately.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="font-size:11px;color:#9ca3af">Automated security notification from CanaFri Platform Security Engine.</p>
      </div>
    `;
    const text = `Security Alert: Administrator Password Changed\nTime: ${details.timestamp.toUTCString()}\nIP: ${details.ip}\nBrowser: ${details.userAgent}`;
    await sendEmail({ to, subject: 'Security Alert: Administrator Password Changed — CanaFri', html, text });
  } catch (err) {
    console.error(`[EmailService] Failed to send admin password change notification to ${to}:`, err);
  }
}