/**
 * EmailService — Enterprise transactional email dispatcher
 *
 * Provider strategy (driven entirely by APP_ENV + environment variables):
 *
 *   Development  (APP_ENV=development)
 *     └── Gmail SMTP  (SMTP_HOST / SMTP_USER / SMTP_PASS)
 *         └── Dev Mock (console log) if SMTP not configured
 *
 *   Production   (APP_ENV=production)
 *     ├── Resend          (RESEND_API_KEY)              — primary
 *     └── AWS SES SMTP    (SMTP_HOST / SMTP_USER / SMTP_PASS) — automatic fallback
 *         └── EmailProviderUnavailableError if both fail
 *
 * Rate limiting:
 *   Redis key  otp:email:<email>
 *   Maximum    5 OTP emails per email address per hour
 *
 * Switching providers requires only .env changes — no code changes.
 */

import { redis } from '../lib/redis.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const FROM_EMAIL             = process.env.EMAIL_FROM || 'CanaFri <noreply@canafri.com>';
const BRAND_COLOR            = '#6C5ECF';
const BRAND_NAME             = 'CanaFri';
const IS_PRODUCTION          = process.env.APP_ENV === 'production';
const EMAIL_OTP_RATE_LIMIT   = 5;
const EMAIL_OTP_RATE_WINDOW  = 3600; // seconds — 1 hour

// ── Custom Error Classes ──────────────────────────────────────────────────────

/**
 * Thrown when all configured email providers fail in production.
 * Routes must catch this and return HTTP 503.
 */
export class EmailProviderUnavailableError extends Error {
  readonly code = 'EMAIL_PROVIDER_UNAVAILABLE';
  constructor() {
    super('Email delivery is temporarily unavailable. Please try again later.');
    this.name = 'EmailProviderUnavailableError';
  }
}

/**
 * Thrown when an email address has exceeded the OTP send rate limit.
 * Routes must catch this and return HTTP 429.
 */
export class EmailRateLimitError extends Error {
  readonly code = 'EMAIL_RATE_LIMIT_EXCEEDED';
  constructor() {
    super('Too many OTP requests. Please try again later.');
    this.name = 'EmailRateLimitError';
  }
}

// ── HTML Template ─────────────────────────────────────────────────────────────

function buildOtpEmailHtml(otp: string, purpose: 'verify' | 'reset'): string {
  const headline = purpose === 'verify' ? 'Email Verification Code' : 'Password Reset Code';
  const bodyText = purpose === 'verify'
    ? `Use the verification code below to confirm your ${BRAND_NAME} account. This code expires in <strong>10 minutes</strong>.`
    : `Use the code below to reset your ${BRAND_NAME} account password. This code expires in <strong>10 minutes</strong>.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${headline}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#111111;border-radius:16px;border:1px solid #1e1e1e;overflow:hidden;max-width:480px;width:100%;">
          <tr>
            <td style="background:${BRAND_COLOR};padding:28px 32px;text-align:center;">
              <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${BRAND_NAME}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 28px;">
              <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#f0f0f0;letter-spacing:-0.2px;">${headline}</h2>
              <p style="margin:0 0 28px;font-size:14px;line-height:22px;color:#a0a0a0;">${bodyText}</p>
              <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                <span style="font-size:38px;font-weight:800;letter-spacing:12px;color:#ffffff;font-variant-numeric:tabular-nums;">${otp}</span>
              </div>
              <p style="margin:0;font-size:12px;line-height:18px;color:#666666;">
                If you did not request this code, you can safely ignore this email. Never share this code with anyone.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#0d0d0d;border-top:1px solid #1e1e1e;padding:18px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#555555;">
                &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Rate Limiting ─────────────────────────────────────────────────────────────

/**
 * Enforces per-email OTP send rate limit using Redis.
 * Redis key: otp:email:<email>   TTL: 1 hour
 * Throws EmailRateLimitError when the limit is exceeded.
 */
async function enforceEmailRateLimit(email: string): Promise<void> {
  const key   = `otp:email:${email}`;
  const count = await redis.incr(key);

  // Set TTL only on first increment — creates a fixed 1-hour window
  if (count === 1) {
    await redis.expire(key, EMAIL_OTP_RATE_WINDOW);
  }

  if (count > EMAIL_OTP_RATE_LIMIT) {
    throw new EmailRateLimitError();
  }
}

// ── Provider: SMTP (Gmail dev / AWS SES fallback) ─────────────────────────────

async function sendViaSmtp(
  options: { to: string; subject: string; html: string },
  providerLabel: string,
): Promise<void> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(`SMTP credentials not configured (required for ${providerLabel}).`);
  }

  // Dynamic import avoids requiring @types/nodemailer at compile time
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const nodemailerMod = await (new Function('m', 'return import(m)'))('nodemailer').catch(() => null);
  if (!nodemailerMod) {
    throw new Error('nodemailer is not installed. Run: npm install nodemailer');
  }

  const nm          = nodemailerMod.default ?? nodemailerMod;
  const transporter = nm.createTransport({
    host,
    port:   parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth:   { user, pass },
  });

  await transporter.sendMail({
    from:    FROM_EMAIL,
    to:      options.to,
    subject: options.subject,
    html:    options.html,
  });

  console.log(`[EmailService] Email Provider: ${providerLabel}`);
}

// ── Provider: Resend ──────────────────────────────────────────────────────────

async function sendViaResend(options: { to: string; subject: string; html: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured.');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from:    FROM_EMAIL,
      to:      [options.to],
      subject: options.subject,
      html:    options.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend responded with HTTP ${res.status}: ${body}`);
  }

  console.log('[EmailService] Email Provider: Resend');
}

// ── Dispatch Engine ───────────────────────────────────────────────────────────

async function dispatch(options: { to: string; subject: string; html: string }): Promise<void> {

  // ─── DEVELOPMENT ────────────────────────────────────────────────────────────
  if (!IS_PRODUCTION) {
    try {
      await sendViaSmtp(options, 'Gmail SMTP');
    } catch {
      // SMTP not configured — print to console (Dev Mock)
      console.log('\n[EmailService] Email Provider: Dev Mock (configure SMTP_* vars to use Gmail)');
      console.log('[MOCK EMAIL] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`[MOCK EMAIL]  To      : ${options.to}`);
      console.log(`[MOCK EMAIL]  Subject : ${options.subject}`);
      console.log('[MOCK EMAIL] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    return;
  }

  // ─── PRODUCTION ─────────────────────────────────────────────────────────────

  // 1. Try Resend (primary)
  if (process.env.RESEND_API_KEY) {
    try {
      await sendViaResend(options);
      return;
    } catch (err: any) {
      console.error('[EmailService] Resend failed:', err?.message ?? err);
      console.warn('[EmailService] Resend failed. Retrying with AWS SES...');
    }
  }

  // 2. Try AWS SES SMTP (automatic fallback)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      await sendViaSmtp(options, 'AWS SES (Fallback)');
      return;
    } catch (err: any) {
      console.error('[EmailService] AWS SES SMTP failed:', err?.message ?? err);
    }
  }

  // 3. All providers exhausted
  console.error('[EmailService] All email providers failed. Delivery aborted.');
  throw new EmailProviderUnavailableError();
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface SendOtpEmailOptions {
  to:  string;
  otp: string;
  /**
   * Skip per-email rate limiting.
   * Only use for internal/admin-triggered sends. Default: false.
   */
  skipRateLimit?: boolean;
}

export class EmailService {
  /**
   * Send a 6-digit email verification OTP (registration / resend).
   *
   * @throws {EmailRateLimitError}           Rate limit exceeded → route returns HTTP 429
   * @throws {EmailProviderUnavailableError} All providers failed → route returns HTTP 503
   */
  static async sendOTPEmail({ to, otp, skipRateLimit = false }: SendOtpEmailOptions): Promise<void> {
    if (!skipRateLimit) await enforceEmailRateLimit(to);

    await dispatch({
      to,
      subject: `${otp} is your ${BRAND_NAME} verification code`,
      html:    buildOtpEmailHtml(otp, 'verify'),
    });
  }

  /**
   * Send a password-reset OTP email.
   *
   * @throws {EmailRateLimitError}           Rate limit exceeded → route returns HTTP 429
   * @throws {EmailProviderUnavailableError} All providers failed → route returns HTTP 503
   */
  static async sendPasswordResetEmail({ to, otp, skipRateLimit = false }: SendOtpEmailOptions): Promise<void> {
    if (!skipRateLimit) await enforceEmailRateLimit(to);

    await dispatch({
      to,
      subject: `${otp} is your ${BRAND_NAME} password reset code`,
      html:    buildOtpEmailHtml(otp, 'reset'),
    });
  }
}