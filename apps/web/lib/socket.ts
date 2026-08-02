'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let isInitialized = false;

/**
 * Initializes and connects the global singleton Socket.IO instance.
 * Delayed until verifyStartupSession() has completed (including silent token refresh)
 * or upon explicit user login.
 */
export function initSocket(explicitToken?: string): Socket | null {
  if (typeof window === 'undefined') return null;

  const token = explicitToken || localStorage.getItem('canafri_access_token');
  if (!token) return null;

  if (!socket) {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    socket = io(backendUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Socket.IO connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket.IO connection warning:', err.message);
    });

    isInitialized = true;
  } else {
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }
  }

  return socket;
}

/**
 * Returns the active global singleton Socket instance.
 * If not yet initialized (e.g. startup session verification still in progress),
 * returns null to prevent unverified early connections with stale tokens.
 */
export function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  if (!socket && isInitialized) {
    return initSocket();
  }

  return socket;
}

/**
 * Updates the authentication token for the active socket connection (used for silent token rotations).
 */
export function updateSocketToken(newToken: string) {
  if (socket) {
    socket.auth = { token: newToken };
    if (socket.connected) {
      socket.disconnect().connect();
    } else {
      socket.connect();
    }
  } else if (isInitialized) {
    initSocket(newToken);
  }
}

/**
 * Disconnects the socket and resets initialization state on logout.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    isInitialized = false;
  }
}
