/**
 * PlatformConfigService
 *
 * PostgreSQL is the single source of truth.
 * Redis is strictly a cache (self-healing, no separate startup routine needed).
 *
 * Read flow:  Redis hit → return instantly
 *             Redis miss / Redis unavailable → read Postgres → repopulate Redis → return
 * Write flow: Write Postgres → increment version atomically → overwrite Redis → broadcast Socket.IO
 */

import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { getIO } from './socket.js';
import { AuditService } from './audit.js';

export const PLATFORM_ID = 'platform';
export const PLATFORM_CACHE_KEY = 'cache:platform_config:platform';
export const PLATFORM_CACHE_TTL = 300; // 5 minutes

/** Fields safe to expose publicly — version & operational flags included so clients react to changes */
export const SANITIZED_FIELDS = {
  version: true,
  subscriptionAmountCC: true,
  poolAllocationCC: true,
  stakeBalanceCC: true,
  platformFeeSub: true,
  platformFeeFreelance: true,
  readStakeAmountCC: true,
  minReadTimeSeconds: true,
  gracePeriodHours: true,
  creatorStakeCC: true,
  creatorLockDays: true,
  maxContentPerMonth: true,
  dailyCheckinCC: true,
  proposalDepositCC: true,
  minTreasuryReserveCC: true,
  incentivePhaseActive: true,

  // Global & Service Maintenance
  globalMaintenance: true,
  globalMaintenanceReason: true,
  freelancingMaintenance: true,
  freelancingMaintenanceReason: true,
  contentMaintenance: true,
  contentMaintenanceReason: true,
  messagingMaintenance: true,
  messagingMaintenanceReason: true,
  registrationPaused: true,
  registrationPausedReason: true,
  loginPaused: true,
  loginPausedReason: true,

  // Financial & Payment Emergency Controls
  walletPaused: true,
  walletPausedReason: true,
  depositPaused: true,
  depositPausedReason: true,
  withdrawPaused: true,
  withdrawPausedReason: true,
  escrowCreatePaused: true,
  escrowCreatePausedReason: true,
  escrowReleasePaused: true,
  escrowReleasePausedReason: true,
  otcTradingPaused: true,
  otcTradingPausedReason: true,

  // System & Infrastructure Controls
  creatorPaused: true,
  creatorPausedReason: true,
  notificationsPaused: true,
  emailSendingPaused: true,
  smsVerificationPaused: true,

  // Country Access Control
  restrictedCountries: true,

  // Scheduled Maintenance Banner
  bannerEnabled: true,
  bannerTitle: true,
  bannerMessage: true,
  bannerStart: true,
  bannerEnd: true,
  bannerDismissible: true,

  updatedAt: true,
} as const;

/** Default singleton record for upsert (all safe defaults) */
const DEFAULT_CONFIG = {
  id: PLATFORM_ID,
  subscriptionAmountCC: 20,
  poolAllocationCC: 15,
  stakeBalanceCC: 5,
  platformFeeSub: 0.30,
  platformFeeFreelance: 0.05,
  readStakeAmountCC: 5,
  minReadTimeSeconds: 1200,
  gracePeriodHours: 2,
  creatorStakeCC: 100,
  creatorLockDays: 14,
  maxContentPerMonth: 5,
  dailyCheckinCC: 0.05,
  proposalDepositCC: 0.5,
  minTreasuryReserveCC: 10000,
  incentivePhaseActive: true,
};

/** Safe Redis get — returns null on any Redis error */
async function redisGetSafe(key: string): Promise<string | null> {
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

/** Safe Redis set — silently ignores Redis errors */
async function redisSetSafe(key: string, value: string, ttlSeconds: number): Promise<void> {
  try {
    await redis.set(key, value, { EX: ttlSeconds });
  } catch {
    // Redis unavailable — Postgres remains the source of truth
  }
}

/**
 * Fetches the singleton PlatformConfig.
 * Redis-first with self-healing fallback to Postgres.
 */
export async function getPlatformConfig() {
  // 1. Try Redis cache first
  const cached = await redisGetSafe(PLATFORM_CACHE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // Corrupt cache — fall through to Postgres
    }
  }

  // 2. Redis miss or error — read Postgres (upsert guarantees singleton exists)
  const config = await prisma.platformConfig.upsert({
    where: { id: PLATFORM_ID },
    create: DEFAULT_CONFIG,
    update: {},
    select: SANITIZED_FIELDS,
  });

  // 3. Repopulate Redis asynchronously (non-blocking, errors ignored)
  redisSetSafe(PLATFORM_CACHE_KEY, JSON.stringify(config), PLATFORM_CACHE_TTL);

  return config;
}

/**
 * Fetches the full PlatformConfig including all fields (SUPER_ADMIN only).
 */
export async function getFullPlatformConfig() {
  const cached = await redisGetSafe(`${PLATFORM_CACHE_KEY}:full`);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }

  const config = await prisma.platformConfig.upsert({
    where: { id: PLATFORM_ID },
    create: DEFAULT_CONFIG,
    update: {},
  });

  redisSetSafe(`${PLATFORM_CACHE_KEY}:full`, JSON.stringify(config), PLATFORM_CACHE_TTL);

  return config;
}

/**
 * Updates the singleton PlatformConfig.
 * - Atomically increments version
 * - Overwrites Redis cache immediately
 * - Broadcasts sanitized payload via Socket.IO
 * - Writes immutable AuditLog entry
 */
export async function updatePlatformConfig(
  data: Record<string, any>,
  adminId: string,
  ipAddress: string,
) {
  const previous = await prisma.platformConfig.upsert({
    where: { id: PLATFORM_ID },
    create: DEFAULT_CONFIG,
    update: {},
  });

  const updated = await prisma.platformConfig.update({
    where: { id: PLATFORM_ID },
    data: {
      ...data,
      version: { increment: 1 },
      updatedBy: adminId,
    },
    select: { ...SANITIZED_FIELDS, updatedAt: true },
  });

  const sanitized = updated;

  redisSetSafe(PLATFORM_CACHE_KEY, JSON.stringify(sanitized), PLATFORM_CACHE_TTL);
  redisSetSafe(`${PLATFORM_CACHE_KEY}:full`, JSON.stringify(updated), PLATFORM_CACHE_TTL);

  // Broadcast to all connected clients
  try {
    const io = getIO();
    io.emit('platform_config_updated', { version: updated.version, config: sanitized });
  } catch {
    // Socket.IO unavailable — clients will resync on next page load
  }

  await AuditService.log({
    adminId,
    action: 'PLATFORM_CONFIG_UPDATED',
    target: PLATFORM_ID,
    before: previous as object,
    after: data,
    ipAddress,
  });

  return sanitized;
}
