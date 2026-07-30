'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket';

export interface PlatformConfig {
  version: number;
  // Service maintenance
  globalMaintenance: boolean;
  globalMaintenanceReason: string | null;
  freelancingMaintenance: boolean;
  freelancingMaintenanceReason: string | null;
  contentMaintenance: boolean;
  contentMaintenanceReason: string | null;
  messagingMaintenance: boolean;
  messagingMaintenanceReason: string | null;
  registrationPaused: boolean;
  registrationPausedReason: string | null;
  loginPaused: boolean;
  loginPausedReason: string | null;
  // Financial controls
  walletPaused: boolean;
  walletPausedReason: string | null;
  depositPaused: boolean;
  depositPausedReason: string | null;
  withdrawPaused: boolean;
  withdrawPausedReason: string | null;
  escrowCreatePaused: boolean;
  escrowCreatePausedReason: string | null;
  escrowReleasePaused: boolean;
  escrowReleasePausedReason: string | null;
  otcTradingPaused: boolean;
  otcTradingPausedReason: string | null;
  // System controls
  creatorPaused: boolean;
  creatorPausedReason: string | null;
  notificationsPaused: boolean;
  emailSendingPaused: boolean;
  smsVerificationPaused: boolean;
  // Country access control
  restrictedCountries: string[];
  // Banner
  bannerEnabled: boolean;
  bannerTitle: string | null;
  bannerMessage: string | null;
  bannerStart: string | null;
  bannerEnd: string | null;
  bannerDismissible: boolean;
  updatedAt: string;
}

const DEFAULT_CONFIG: PlatformConfig = {
  version: 0,
  globalMaintenance: false,
  globalMaintenanceReason: null,
  freelancingMaintenance: false,
  freelancingMaintenanceReason: null,
  contentMaintenance: false,
  contentMaintenanceReason: null,
  messagingMaintenance: false,
  messagingMaintenanceReason: null,
  registrationPaused: false,
  registrationPausedReason: null,
  loginPaused: false,
  loginPausedReason: null,
  walletPaused: false,
  walletPausedReason: null,
  depositPaused: false,
  depositPausedReason: null,
  withdrawPaused: false,
  withdrawPausedReason: null,
  escrowCreatePaused: false,
  escrowCreatePausedReason: null,
  escrowReleasePaused: false,
  escrowReleasePausedReason: null,
  otcTradingPaused: false,
  otcTradingPausedReason: null,
  creatorPaused: false,
  creatorPausedReason: null,
  notificationsPaused: false,
  emailSendingPaused: false,
  smsVerificationPaused: false,
  restrictedCountries: [],
  bannerEnabled: false,
  bannerTitle: null,
  bannerMessage: null,
  bannerStart: null,
  bannerEnd: null,
  bannerDismissible: true,
  updatedAt: new Date().toISOString(),
};

interface PlatformConfigContextValue {
  config: PlatformConfig;
  loading: boolean;
  refresh: () => Promise<void>;
}

const PlatformConfigContext = createContext<PlatformConfigContextValue>({
  config: DEFAULT_CONFIG,
  loading: true,
  refresh: async () => {},
});

export function PlatformConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<PlatformConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const lastVersionRef = useRef<number>(0);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/platform/config');
      if (res.ok) {
        const data = await res.json();
        if (data.config && data.config.version > lastVersionRef.current) {
          lastVersionRef.current = data.config.version;
          setConfig(data.config);
        }
      }
    } catch {
      // Network unavailable — keep existing config
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Subscribe to real-time platform config updates from Socket.IO
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const socket = getSocket();
    if (!socket) return;

    const handleConfigUpdate = (payload: { version: number; config: PlatformConfig }) => {
      // Reject stale or out-of-order network updates
      if (payload.version > lastVersionRef.current) {
        lastVersionRef.current = payload.version;
        setConfig(payload.config);
      }
    };

    socket.on('platform_config_updated', handleConfigUpdate);
    return () => {
      socket.off('platform_config_updated', handleConfigUpdate);
    };
  }, []);

  return (
    <PlatformConfigContext.Provider value={{ config, loading, refresh: fetchConfig }}>
      {children}
    </PlatformConfigContext.Provider>
  );
}

export function usePlatformConfig() {
  return useContext(PlatformConfigContext);
}
