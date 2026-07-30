'use client';

import { updateSocketToken, disconnectSocket } from './socket';

let refreshPromise: Promise<string> | null = null;
let hasHandledSessionExpired = false;

/**
 * Retrieves or creates a persistent client Device ID stored in localStorage.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let deviceId = localStorage.getItem('canafri_device_id');
  if (!deviceId) {
    deviceId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('canafri_device_id', deviceId);
  }
  return deviceId;
}

/**
 * Clears local credentials and dispatches session-expired event.
 * Deduplicated to ensure only a single toast/event fires during session expiration.
 */
export function handleSessionExpired() {
  if (typeof window !== 'undefined') {
    disconnectSocket();
    localStorage.removeItem('canafri_access_token');
    localStorage.removeItem('canafri_user_profile');
    localStorage.removeItem('canafri_active_page');
    if (!hasHandledSessionExpired) {
      hasHandledSessionExpired = true;
      window.dispatchEvent(new CustomEvent('canafri:session-expired'));
      setTimeout(() => {
        hasHandledSessionExpired = false;
      }, 3000);
    }
  }
}

/**
 * Triggers a single-flight silent refresh request to /api/auth/refresh (using HttpOnly cookie).
 * If a refresh is already in progress, reuses the existing pending Promise to prevent race conditions & token theft false positives.
 */
export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const deviceId = getOrCreateDeviceId();
      const headers: Record<string, string> = {};
      if (deviceId) {
        headers['X-Device-ID'] = deviceId;
      }

      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Refresh token expired or invalid');
      }

      const data = await res.json();
      if (!data.accessToken) {
        throw new Error('No access token returned from refresh');
      }

      const newToken = data.accessToken;
      if (typeof window !== 'undefined') {
        localStorage.setItem('canafri_access_token', newToken);
      }

      updateSocketToken(newToken);
      return newToken;
    } catch (err) {
      handleSessionExpired();
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Centralized API client wrapper around standard fetch.
 * Automatically attaches Authorization header and X-Device-ID header, handles 401s via silent refresh & retry.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('canafri_admin_access_token') || localStorage.getItem('canafri_access_token')
      : null;
  const deviceId = getOrCreateDeviceId();

  const headers = new Headers(init?.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (deviceId && !headers.has('X-Device-ID')) {
    headers.set('X-Device-ID', deviceId);
  }

  const modifiedInit: RequestInit = {
    ...init,
    headers,
  };

  let response = await fetch(input, modifiedInit);

  // Handle 401 Unauthorized — attempt single-flight silent refresh & retry
  if (response.status === 401) {
    const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;

    // Avoid infinite loop if the refresh or auth endpoints themselves return 401
    if (urlString.includes('/api/auth/refresh') || urlString.includes('/api/auth/login')) {
      return response;
    }

    try {
      const newToken = await refreshAccessToken();
      const retryHeaders = new Headers(init?.headers || {});
      retryHeaders.set('Authorization', `Bearer ${newToken}`);
      if (deviceId && !retryHeaders.has('X-Device-ID')) {
        retryHeaders.set('X-Device-ID', deviceId);
      }
      return await fetch(input, { ...init, headers: retryHeaders });
    } catch (refreshErr) {
      return response;
    }
  }

  return response;
}

/**
 * Verifies session on app startup by leveraging apiFetch to /api/users/me.
 * Returns user profile data if valid, null if session is expired/invalid.
 */
export async function verifyStartupSession(): Promise<{ user: any } | null> {
  try {
    const res = await apiFetch('/api/users/me');
    if (res.ok) {
      const data = await res.json();
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Performs server-side logout, clears local state, and updates socket.
 */
export async function performLogout() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('canafri_access_token') : null;
  const deviceId = getOrCreateDeviceId();
  if (token) {
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      if (deviceId) {
        headers['X-Device-ID'] = deviceId;
      }
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers,
        credentials: 'include',
      });
    } catch {
      // Ignore network errors during logout
    }
  }
  handleSessionExpired();
}
