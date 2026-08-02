'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle, Clock } from 'lucide-react';
import { usePlatformConfig } from '@/lib/platform-config-context';

/**
 * MaintenanceBanner
 *
 * Sticky top announcement banner that renders when bannerEnabled === true
 * and the current time is within the optional bannerStart / bannerEnd window.
 * ISOLATED from manual emergency pauses — window expiry only hides the banner.
 */
export function MaintenanceBanner() {
  const { config } = usePlatformConfig();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismiss state whenever banner content changes
  useEffect(() => {
    setDismissed(false);
  }, [config.bannerEnabled, config.bannerMessage, config.bannerTitle]);

  if (!config.bannerEnabled || dismissed) return null;

  const now = new Date();
  const start = config.bannerStart ? new Date(config.bannerStart) : null;
  const end = config.bannerEnd ? new Date(config.bannerEnd) : null;

  // Enforce scheduled window
  if (start && now < start) return null;
  if (end && now > end) return null;

  const title = config.bannerTitle || 'Scheduled Maintenance';
  const message = config.bannerMessage || '';

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 100,
        width: '100%',
        background: 'linear-gradient(90deg, #1a0a2e 0%, #2d1055 50%, #1a0a2e 100%)',
        borderBottom: '1px solid rgba(140,92,255,0.3)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        {/* Icon */}
        <span style={{ color: '#a78bfa', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <AlertTriangle size={16} strokeWidth={2} />
        </span>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontFamily: 'var(--font-sans, system-ui)',
              fontSize: '12px',
              fontWeight: 600,
              color: '#e9d5ff',
              marginRight: '6px',
            }}
          >
            {title}
          </span>
          {message && (
            <span
              style={{
                fontFamily: 'var(--font-sans, system-ui)',
                fontSize: '12px',
                fontWeight: 400,
                color: '#c4b5fd',
              }}
            >
              {message}
            </span>
          )}
        </div>

        {/* Scheduled time indicator */}
        {(start || end) && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: '#a78bfa',
              flexShrink: 0,
              fontFamily: 'var(--font-sans, system-ui)',
            }}
          >
            <Clock size={12} />
            {start && (
              <span>
                {new Date(start).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
              </span>
            )}
            {start && end && <span>–</span>}
            {end && (
              <span>
                {new Date(end).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
              </span>
            )}
          </span>
        )}

        {/* Dismiss button */}
        {config.bannerDismissible && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#a78bfa',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              padding: '2px',
              borderRadius: '4px',
            }}
            aria-label="Dismiss maintenance banner"
          >
            <X size={14} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}
