import { redis } from '../lib/redis.js';

export interface SendOtpOptions {
  phoneHash: string;
  rawPhone?: string; // Optional e.g. "+2348123456789" for real SMS delivery in production
}

export class OTPService {
  /**
   * Generates a 6-digit OTP, caches it in Redis (valid for 5 minutes),
   * and dispatches SMS via Termii -> Africa's Talking -> Mock fallback.
   * Enforces max 5 OTP requests per hour and 3-attempt failure lockouts.
   */
  static async sendOTP(options: SendOtpOptions | string): Promise<{ success: boolean; code?: string; message: string }> {
    const phoneHash = typeof options === 'string' ? options : options.phoneHash;
    const rawPhone = typeof options === 'string' ? undefined : options.rawPhone;

    const hourKey = `otp_count:${phoneHash}`;
    const failuresKey = `otp_failures:${phoneHash}`;

    // 1. Check if account is currently locked due to failures
    const failures = await redis.get(failuresKey);
    if (failures && parseInt(failures, 10) >= 3) {
      return {
        success: false,
        message: 'Your account has been temporarily locked. Please try again in 30 minutes.',
      };
    }

    // 2. Check hourly limit (max 5 requests per hour)
    const requestCount = await redis.get(hourKey);
    if (requestCount && parseInt(requestCount, 10) >= 5) {
      return {
        success: false,
        message: 'You have requested too many verification codes. Please wait before trying again.',
      };
    }

    // 3. Generate 6-digit OTP
    const isDev = process.env.NODE_ENV !== 'production' && !process.env.TERMII_API_KEY && !process.env.AFRICASTALKING_API_KEY;
    const otpCode = isDev ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const otpKey = `otp:${phoneHash}`;

    // Cache the OTP for 5 minutes (300 seconds)
    await redis.set(otpKey, otpCode, { EX: 300 });

    // Track hourly count
    if (!requestCount) {
      await redis.set(hourKey, '1', { EX: 3600 });
    } else {
      await redis.incr(hourKey);
    }

    // 4. Dispatch SMS
    const providerResult = await this.dispatchSms(rawPhone || phoneHash, otpCode);

    if (isDev || !rawPhone) {
      console.log(`[MOCK SMS] Sent OTP code '${otpCode}' to phone/hash: ${rawPhone || phoneHash}`);
    }

    return {
      success: true,
      code: isDev ? otpCode : undefined, // expose code only in dev mode
      message: providerResult.message || 'OTP sent successfully.',
    };
  }

  /**
   * Internal SMS Dispatcher with Termii -> Africa's Talking -> Fallback logic
   */
  private static async dispatchSms(phone: string, code: string): Promise<{ success: boolean; message: string }> {
    const termiiKey = process.env.TERMII_API_KEY;
    const atApiKey = process.env.AFRICASTALKING_API_KEY;

    // Primary Provider: Termii
    if (termiiKey) {
      try {
        const response = await fetch('https://api.ng.termii.com/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: phone,
            from: process.env.TERMII_SENDER_ID || 'CanaFri',
            sms: `Your CanaFri verification code is ${code}. Valid for 5 minutes.`,
            type: 'plain',
            channel: 'generic',
            api_key: termiiKey,
          }),
        });

        if (response.ok) {
          return { success: true, message: 'OTP delivered via Termii SMS.' };
        }
        console.warn('[OTPService] Termii SMS dispatch failed, attempting fallback to Africa\'s Talking...');
      } catch (err) {
        console.warn('[OTPService] Termii API error:', err);
      }
    }

    // Fallback Provider: Africa's Talking
    if (atApiKey && process.env.AFRICASTALKING_USERNAME) {
      try {
        const params = new URLSearchParams();
        params.append('username', process.env.AFRICASTALKING_USERNAME);
        params.append('to', phone);
        params.append('message', `Your CanaFri verification code is ${code}. Valid for 5 minutes.`);

        const response = await fetch('https://api.africastalking.com/version1/messaging', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'apiKey': atApiKey,
            'Accept': 'application/json',
          },
          body: params.toString(),
        });

        if (response.ok) {
          return { success: true, message: 'OTP delivered via Africa\'s Talking SMS.' };
        }
      } catch (err) {
        console.warn('[OTPService] Africa\'s Talking API error:', err);
      }
    }

    return { success: true, message: 'OTP code generated successfully.' };
  }

  /**
   * Verifies an OTP code against the cached value in Redis.
   * Handles maximum 3 failures locking.
   */
  static async verifyOTP(phoneHash: string, code: string): Promise<{ success: boolean; message: string }> {
    const otpKey = `otp:${phoneHash}`;
    const failuresKey = `otp_failures:${phoneHash}`;

    // Check if locked
    const failures = await redis.get(failuresKey);
    if (failures && parseInt(failures, 10) >= 3) {
      return {
        success: false,
        message: 'Your account has been temporarily locked. Please try again in 30 minutes.',
      };
    }

    const cachedCode = await redis.get(otpKey);
    if (!cachedCode) {
      return {
        success: false,
        message: 'OTP expired or does not exist. Please request a new one.',
      };
    }

    if (cachedCode !== code) {
      // Increment failure count
      let currentFailures = 1;
      if (failures) {
        currentFailures = await redis.incr(failuresKey);
      } else {
        await redis.set(failuresKey, '1', { EX: 1800 }); // Lock/expire in 30 mins
      }

      if (currentFailures >= 3) {
        // Set expiry to 30 minutes lock
        await redis.expire(failuresKey, 1800);
        return {
          success: false,
          message: 'Incorrect OTP. Account has been locked for 30 minutes.',
        };
      }

      return {
        success: false,
        message: `Incorrect OTP. ${3 - currentFailures} attempts remaining before temporary lock.`,
      };
    }

    // Success - clear OTP and failures
    await redis.del(otpKey);
    await redis.del(failuresKey);

    return {
      success: true,
      message: 'OTP verified successfully.',
    };
  }
}
