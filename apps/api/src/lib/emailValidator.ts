/**
 * Email Validation & Sanitization Helpers
 *
 * Architecture:
 * - Email syntax validation and business rules are kept as separate concerns.
 * - validator.isEmail() determines whether an email is syntactically valid.
 * - CanaFri's Gmail restrictions (no dots, no + aliases) are business rules
 *   that apply only to gmail.com.
 * - Future provider-specific policies (if ever needed) should be implemented
 *   as separate business rules, NOT by modifying the syntax validator.
 */

import validator from 'validator';

// ─── Disposable Email Blocklist ──────────────────────────────────────────────
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  'guerrillamail.com',
  'guerrillamail.block',
  '10minutemail.com',
  'trashmail.com',
  'yopmail.com',
  'dispostable.com',
  'sharklasers.com',
  'mohmal.com',
  'throwawaymail.com',
  'fakeinbox.com',
  'getairmail.com',
  'maildrop.cc',
  'mailnesia.com',
  'crazymailing.com',
  'nada.ltd',
  'getnada.com',
  'tempmailo.com',
  'byom.de',
  'mytemp.email',
  'emailondeck.com',
  'zmail.com',
  'burnermail.io',
  'inboxkitten.com',
]);

// ─── Common Domain Typo Suggestions ─────────────────────────────────────────
const DOMAIN_TYPOS: Record<string, string> = {
  'gail.com':       'gmail.com',
  'gmai.com':       'gmail.com',
  'gmial.com':      'gmail.com',
  'gamil.com':      'gmail.com',
  'gmaill.com':     'gmail.com',
  'gmai.co':        'gmail.com',
  'gmai.con':       'gmail.com',
  'gmal.com':       'gmail.com',
  'yaho.com':       'yahoo.com',
  'yahoo.co':       'yahoo.com',
  'yaho.co':        'yahoo.com',
  'yaho.org':       'yahoo.com',
  'hotmial.com':    'hotmail.com',
  'hotmai.com':     'hotmail.com',
  'hotmial.co':     'hotmail.com',
  'outlok.com':     'outlook.com',
  'outook.com':     'outlook.com',
  'iclou.com':      'icloud.com',
  'iclud.com':      'icloud.com',
  'protnmail.com':  'protonmail.com',
  'protonmial.com': 'protonmail.com',
};

// ─── Sanitization ────────────────────────────────────────────────────────────

/**
 * Strips HTML tags, inline JS, and trims whitespace.
 */
export function sanitizeInput(val: string): string {
  if (!val) return '';
  return val
    .trim()
    .replace(/<[^>]*>?/gm, '')
    .replace(/javascript:/gi, '');
}

// ─── Step 1: Syntax Validation ───────────────────────────────────────────────

/**
 * Determines whether an email address is syntactically valid.
 *
 * This function is the sole authority on email syntax.
 * It delegates entirely to validator.isEmail() (validator.js).
 * No custom regex, no custom TLD database, no hardcoded length rules.
 *
 * The only addition is a minimal provider sanity check:
 * if the domain prefix matches a known provider but is not the exact
 * canonical domain (e.g. "gmail.coml", "gmail.comm", "gmail.xyz"),
 * the address is rejected.
 *
 * This is NOT a business rule — it is a structural sanity check for
 * domains that no real provider would use.
 */
export function isValidEmailSyntax(email: string): boolean {
  if (!email || typeof email !== 'string') return false;

  const trimmed = email.trim();

  // Primary validation: delegate to validator.js
  if (!validator.isEmail(trimmed, { allow_utf8_local_part: false, require_tld: true })) {
    return false;
  }

  const domain = trimmed.split('@')[1].toLowerCase();

  // Minimal provider sanity check.
  // If the domain starts with a known provider prefix but is NOT the exact
  // canonical domain, it is not a valid address for that provider.
  // (e.g. gmail.coml, gmail.comm, gmail.comffff are not Gmail)
  if (domain.startsWith('gmail.') && domain !== 'gmail.com') return false;
  if (domain.startsWith('yahoo.') && domain !== 'yahoo.com' && domain !== 'yahoo.co.uk') return false;
  if (domain.startsWith('outlook.') && domain !== 'outlook.com') return false;
  if (domain.startsWith('hotmail.') && domain !== 'hotmail.com' && domain !== 'hotmail.co.uk') return false;
  if (domain.startsWith('googlemail.') && domain !== 'googlemail.com') return false;

  return true;
}

// ─── Step 2: Disposable Email Check ─────────────────────────────────────────

/**
 * Returns true if the email belongs to a known disposable email provider.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}

// ─── Step 3: CanaFri Gmail Business Policy ───────────────────────────────────

/**
 * CanaFri Gmail Business Policy.
 *
 * This is NOT email syntax validation.
 * This is a CanaFri business rule that applies only to @gmail.com addresses.
 *
 * We intentionally require users to enter their Gmail address in its
 * standard format: no dots (.) in the local part and no + aliases.
 *
 * This prevents abuse via Gmail's address aliasing behaviour.
 * This rule applies only to gmail.com. All other providers are unaffected.
 *
 * Future provider-specific rules (if ever needed) should be added here
 * as separate conditions, not inside isValidEmailSyntax().
 */
export function validateGmailStandardFormat(email: string): { valid: boolean; message?: string } {
  if (!email || !email.includes('@')) return { valid: true };

  const parts = email.split('@');
  if (parts.length !== 2) return { valid: true };

  const localPart = parts[0];
  const domain = parts[1].toLowerCase().trim();

  // Gmail-specific business policy — only applies to gmail.com
  if (domain === 'gmail.com') {
    if (localPart.includes('.') || localPart.includes('+')) {
      return {
        valid: false,
        message: 'Please enter your Gmail in its standard format.',
      };
    }
  }

  return { valid: true };
}

// ─── Domain Typo Detection ───────────────────────────────────────────────────

/**
 * Detects common email domain typos and returns a suggested correction.
 */
export function detectDomainTypo(email: string): string | null {
  if (!email || !email.includes('@')) return null;
  const parts = email.split('@');
  if (parts.length !== 2) return null;

  const localPart = parts[0];
  const domain = parts[1].toLowerCase().trim();

  const suggested = DOMAIN_TYPOS[domain];
  return suggested ? `${localPart}@${suggested}` : null;
}

// ─── Unified Validation Entry Point ─────────────────────────────────────────

/**
 * Unified email validation engine.
 *
 * Executes in strict order:
 *   1. Sanitize input
 *   2. Syntax validation (validator.isEmail + provider sanity check)
 *   3. Disposable email check
 *   4. CanaFri Gmail business policy (gmail.com only)
 *
 * Syntax validation and business rules remain separate concerns.
 */
export function validateEmailAddress(email: string): { valid: boolean; message?: string } {
  const sanitized = sanitizeInput(email);

  // Step 1: Syntax validation
  if (!isValidEmailSyntax(sanitized)) {
    return { valid: false, message: 'Please enter a valid email address.' };
  }

  // Step 2: Disposable email check
  if (isDisposableEmail(sanitized)) {
    return { valid: false, message: 'Disposable email addresses are not allowed.' };
  }

  // Step 3: CanaFri Gmail business policy (gmail.com only)
  const gmailCheck = validateGmailStandardFormat(sanitized);
  if (!gmailCheck.valid) {
    return gmailCheck;
  }

  return { valid: true };
}
