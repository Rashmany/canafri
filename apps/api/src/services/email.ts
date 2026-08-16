import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// ── Transporter Setup ─────────────────────────────────────────────────────────

function createSmtpTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });
  }
  return null;
}

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.SES_FROM_EMAIL || 'CanaFri Support <no-reply@canafri.com>';
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
  purpose: 'registration' | 'forgot_password' | 'verification' = 'registration'
): Promise<void> {
  const title = purpose === 'forgot_password' ? 'Reset Your Password' : 'Verify Your Email Address';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #0b0b0b; color: #ffffff; border-radius: 16px; border: 1px solid #1f1f23;">
      <div style="text-align: center; margin-bottom: 28px;">
        <h2 style="color: #8C5CFF; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.5px;">CanaFri</h2>
        <p style="color: #a0a0a0; font-size: 14px; margin: 0;">${title}</p>
      </div>

      <div style="background: #141418; border: 1px solid #2a2a34; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="font-size: 13px; color: #a0a0a0; margin: 0 0 12px 0;">Your 6-digit verification code is:</p>
        <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #8C5CFF; margin: 12px 0;">${otp}</div>
        <p style="font-size: 11px; color: #707075; margin: 12px 0 0 0;">This code is valid for 15 minutes. Do not share it with anyone.</p>
      </div>

      <p style="font-size: 12px; color: #707075; text-align: center; margin: 0;">If you did not request this code, please ignore this email.</p>
    </div>
  `;
  const text = `CanaFri - ${title}\n\nYour 6-digit verification code is: ${otp}\n\nThis code expires in 15 minutes.`;

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