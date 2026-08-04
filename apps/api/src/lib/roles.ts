/**
 * Shared Role Definitions & Portal Access Helpers
 *
 * Portal Access vs Feature Authorization:
 * - canAccessAdminPortal(): Determines if an account is allowed to log into the Admin Portal.
 * - roleGuard(): Single source of truth for feature-level authorization.
 */

export const ADMIN_PORTAL_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'CONTENT_ADMIN',
  'FINANCE_ADMIN',
  'SUPPORT_ADMIN',
] as const;

export type AdminPortalRole = (typeof ADMIN_PORTAL_ROLES)[number];

/**
 * Pure Portal Access helper.
 * Answers ONLY: "Is this role allowed to log into the Admin Portal?"
 */
export function canAccessAdminPortal(role?: string | null): boolean {
  if (!role) return false;
  return (ADMIN_PORTAL_ROLES as readonly string[]).includes(role);
}
