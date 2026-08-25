'use client';

import { createContext, useContext } from 'react';

/**
 * NavContext
 * Provides a global `navigate(page)` function so deeply-nested components
 * (e.g. Footer) can trigger SPA navigation without prop drilling.
 */
const NavContext = createContext<((page: string) => void) | null>(null);

export const NavProvider = NavContext.Provider;

export function useNav(): (page: string) => void {
  const fn = useContext(NavContext);
  // Return a no-op when rendered outside a provider (e.g. during SSR or tests)
  return fn ?? (() => {});
}
