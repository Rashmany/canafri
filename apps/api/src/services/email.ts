import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// ── SES Client ────────────────────────────────────────────────────────────────

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const FROM_EMAIL = process.env.SES_FROM_EMAIL || 'support@canafri.io';
const SUPPORT_NOTIFY_EMAIL = process.env.SUPPORT_NOTIFY_EMAIL || 'team@canafri.io';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  if (!accessKey || accessKey === 'your_aws_access_key_id') {
    console.warn('[EmailService] AWS SES credentials unconfigured in .env — skipping email dispatch.');
    return;
  }
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
}

// ── Email templates ───────────────────────────────────────────────────────────

/**
 * Sent to the user immediately after creating a support ticket.
 * Fire-and-forget — never throws.
 */
export async function sendTicketConfirmationEmail(
  to: string,
  ticketNumber: string,
  subject: string,
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
    const text = `Security Alert: Administrator Password Changed\n\nYour CanaFri administrator password was updated.\nTime: ${details.timestamp.toUTCString()}\nIP: ${details.ip}\nBrowser: ${details.userAgent}\n\nIf you did NOT perform this change, contact support immediately.`;
    await sendEmail({ to, subject: 'Security Alert: Administrator Password Changed — CanaFri', html, text });
  } catch (err) {
    console.error(`[EmailService] Failed to send password change security alert to ${to}:`, err);
  }
}

/**
 * Sent to the support team inbox when a new ticket arrives.
 * Fire-and-forget — never throws.
 */
export async function notifySupportTeamNewTicket(
  ticketNumber: string,
  category: string,
  subject: string,
  userEmail: string,
): Promise<void> {
  try {
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <h2 style="color:#8C5CFF">New Support Ticket — ${ticketNumber}</h2>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px 0;color:#555;font-size:13px">From</td><td style="padding:8px 0">${userEmail}</td></tr>
          <tr><td style="padding:8px 0;color:#555;font-size:13px">Category</td><td style="padding:8px 0">${category}</td></tr>
          <tr><td style="padding:8px 0;color:#555;font-size:13px">Subject</td><td style="padding:8px 0">${subject}</td></tr>
        </table>
        <p style="font-size:13px;color:#555">Log in to the Admin Panel to view and respond to this ticket.</p>
      </div>
    `;
    const text = `New Support Ticket: ${ticketNumber}\nFrom: ${userEmail}\nCategory: ${category}\nSubject: ${subject}`;
    await sendEmail({ to: SUPPORT_NOTIFY_EMAIL, subject: `[${ticketNumber}] New Ticket — ${category}`, html, text });
  } catch (err) {
    console.error(`[EmailService] Failed to notify support team for ticket ${ticketNumber}:`, err);
  }
}

/**
 * Sent to the user when an admin writes a reply.
 * Fire-and-forget — never throws.
 */
export async function sendAdminReplyEmail(
  to: string,
  ticketNumber: string,
  status: string,
  replyText: string,
  subject: string,
): Promise<void> {
  try {
    const statusLabel = formatStatus(status);
    const statusColor = status === 'RESOLVED' ? '#22c55e' : status === 'WAITING_FOR_USER' ? '#f59e0b' : '#8C5CFF';

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <h2 style="color:#8C5CFF">Support Update — ${ticketNumber}</h2>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px 0;color:#555;font-size:13px">Reference</td><td style="padding:8px 0;font-weight:600">${ticketNumber}</td></tr>
          <tr><td style="padding:8px 0;color:#555;font-size:13px">Subject</td><td style="padding:8px 0">${subject}</td></tr>
          <tr><td style="padding:8px 0;color:#555;font-size:13px">Status</td><td style="padding:8px 0"><span style="background:${statusColor};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px">${statusLabel}</span></td></tr>
        </table>
        <div style="background:#f9f9f9;border-left:3px solid #8C5CFF;padding:12px 16px;border-radius:4px;margin:16px 0">
          <p style="margin:0;font-size:14px;line-height:1.6">${replyText.replace(/\n/g, '<br/>')}</p>
        </div>
        ${status === 'WAITING_FOR_USER' ? '<p style="font-size:13px;color:#555">Please log in to your dashboard and open this ticket to provide the requested information.</p>' : ''}
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="font-size:11px;color:#aaa">This is an automated email from CanaFri Support. Please do not reply directly to this email.</p>
      </div>
    `;
    const text = `Support Update: ${ticketNumber}\nStatus: ${statusLabel}\n\nReply:\n${replyText}`;
    await sendEmail({ to, subject: `[${ticketNumber}] Support Update — ${statusLabel}`, html, text });
  } catch (err) {
    console.error(`[EmailService] Failed to send reply email to ${to} for ticket ${ticketNumber}:`, err);
  }
}