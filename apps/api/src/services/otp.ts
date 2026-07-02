import { redis } from '../lib/redis.js';

export class OTPService {
  /**
   * Generates a 6-digit mock OTP, caches it in Redis (valid for 5 minutes), and returns it.
   * Enforces the rule of max 5 OTP requests per hour.
   */
  static async sendOTP(phoneHash: string): Promise<{ success: boolean; code?: string; message: string }> {
    const hourKey = `otp_count:${phoneHash}`;
    const failuresKey = `otp_failures:${phoneHash}`;

    // Check if account is currently locked due to failures
    const failures = await redis.get(failuresKey);
    if (failures && parseInt(failures, 10) >= 3) {
      return {
        success: false,
        message: 'Account temporarily locked due to too many failed OTP attempts. Try again in 30 minutes.',
      };
    }

    // Check hourly limit
    const requestCount = await redis.get(hourKey);
    if (requestCount && parseInt(requestCount, 10) >= 5) {
      return {
        success: false,
        message: 'OTP request limit exceeded. Maximum 5 OTP requests per hour.',
      };
    }

    // Generate standard 6-digit OTP
    const mockCode = '123456'; // Standard mock OTP for local dev/testing
    const otpKey = `otp:${phoneHash}`;

    // Cache the OTP for 5 minutes (300 seconds)
    await redis.set(otpKey, mockCode, { EX: 300 });

    // Track hourly count
    if (!requestCount) {
      await redis.set(hourKey, '1', { EX: 3600 });
    } else {
      await redis.incr(hourKey);
    }

    // Log the generated OTP for console-based verification in dev mode
    console.log(`[MOCK SMS] Sent OTP to phone hash ${phoneHash}: Code is ${mockCode}`);

    return {
      success: true,
      code: mockCode,
      message: 'OTP sent successfully (dev mock)',
    };
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
        message: 'Account temporarily locked due to too many failed OTP attempts. Try again in 30 minutes.',
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
