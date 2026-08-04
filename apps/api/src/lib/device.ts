/**
 * device.ts
 * Parses a raw User-Agent string into a concise human-readable device name.
 * e.g. "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0"
 *  →  "Chrome on Windows 11"
 */

export function parseDeviceName(userAgent?: string | null): string {
  if (!userAgent) return 'Unknown Device';

  const ua = userAgent.toLowerCase();

  // ── Browser ────────────────────────────────────────────────────────────────
  let browser = 'Browser';
  if (ua.includes('edg/') || ua.includes('edge/')) {
    browser = 'Edge';
  } else if (ua.includes('opr/') || ua.includes('opera/')) {
    browser = 'Opera';
  } else if (ua.includes('firefox/')) {
    browser = 'Firefox';
  } else if (ua.includes('chrome/') && !ua.includes('chromium/')) {
    browser = 'Chrome';
  } else if (ua.includes('chromium/')) {
    browser = 'Chromium';
  } else if (ua.includes('safari/') && !ua.includes('chrome/')) {
    browser = 'Safari';
  } else if (ua.includes('msie') || ua.includes('trident/')) {
    browser = 'IE';
  }

  // ── OS / Platform ──────────────────────────────────────────────────────────
  let os = 'Unknown OS';
  if (ua.includes('windows nt 10.0') || ua.includes('windows nt 10')) {
    // Windows 10 and Windows 11 share the same NT 10.0 token;
    // use "Windows" rather than guessing the minor build.
    os = 'Windows';
  } else if (ua.includes('windows nt 6.3')) {
    os = 'Windows 8.1';
  } else if (ua.includes('windows nt 6.2')) {
    os = 'Windows 8';
  } else if (ua.includes('windows nt 6.1')) {
    os = 'Windows 7';
  } else if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('iphone')) {
    os = 'iPhone';
  } else if (ua.includes('ipad')) {
    os = 'iPad';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('mac os x') || ua.includes('macintosh')) {
    os = 'macOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('cros')) {
    os = 'ChromeOS';
  }

  return `${browser} on ${os}`;
}
