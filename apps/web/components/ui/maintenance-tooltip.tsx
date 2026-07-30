'use client';

import { Wrench } from 'lucide-react';

interface MaintenanceTooltipProps {
  /** The maintenance reason message from PlatformConfig */
  reason: string | null;
  /** Default fallback message */
  defaultMessage?: string;
  /** Content to wrap — the trigger element */
  children: React.ReactNode;
  /** Whether maintenance is active */
  active: boolean;
}

/**
 * MaintenanceTooltip
 *
 * Wraps any interactive element (button, toggle, etc).
 * When `active === true`, it renders a lightweight inline tooltip above the element
 * showing the configured maintenance reason.
 * Does NOT redirect users to an error page.
 */
export function MaintenanceTooltip({
  reason,
  defaultMessage = 'This service is currently under maintenance. Please check back later.',
  children,
  active,
}: MaintenanceTooltipProps) {
  if (!active) return <>{children}</>;

  const message = reason || defaultMessage;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div className="maintenance-tooltip-wrapper">
        {/* Disabled wrapper — prevents click events */}
        <div
          style={{
            pointerEvents: 'none',
            opacity: 0.45,
            cursor: 'not-allowed',
            userSelect: 'none',
          }}
          aria-disabled="true"
        >
          {children}
        </div>

        {/* Tooltip bubble */}
        <div className="maintenance-tooltip-bubble">
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wrench size={12} strokeWidth={2} style={{ flexShrink: 0, color: '#a78bfa' }} />
            <span>{message}</span>
          </span>
          {/* Arrow */}
          <div className="maintenance-tooltip-arrow" />
        </div>
      </div>

      <style>{`
        .maintenance-tooltip-wrapper {
          position: relative;
          display: inline-block;
        }
        .maintenance-tooltip-wrapper:hover .maintenance-tooltip-bubble,
        .maintenance-tooltip-wrapper:focus-within .maintenance-tooltip-bubble {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
        .maintenance-tooltip-bubble {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%) translateY(4px);
          min-width: 220px;
          max-width: 280px;
          padding: 8px 12px;
          background: #1a0a2e;
          border: 1px solid rgba(140, 92, 255, 0.4);
          border-radius: 10px;
          font-family: var(--font-sans, system-ui);
          font-size: 11px;
          font-weight: 500;
          color: #c4b5fd;
          line-height: 1.5;
          white-space: normal;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s;
          z-index: 200;
          pointer-events: none;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        }
        .maintenance-tooltip-arrow {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid rgba(140, 92, 255, 0.4);
        }
      `}</style>
    </div>
  );
}
