import { createContext, useContext, useEffect } from 'react'

// Context + hooks for the orientation guard. Split from the Provider component
// so react-refresh (Fast Refresh) can keep working — its only-export-components
// rule bans mixing non-component exports with component exports in one file.
// The Provider lives in orientation-provider.tsx.

export interface OrientationCtx {
  allowedCount: number
  add: () => void
  remove: () => void
}

export const OrientationContext = createContext<OrientationCtx | null>(null)

// Opt-out hook for a landscape-first render tree (e.g., a landscape minigame).
// Mount → landscape allowed; unmount → back to portrait-locked. Safe outside a
// provider (no-op) so tests / previews don't need to wire the provider up.
export function useAllowLandscape() {
  const ctx = useContext(OrientationContext)
  useEffect(() => {
    if (!ctx) return
    ctx.add()
    return () => ctx.remove()
  }, [ctx])
}

export function useIsLandscapeAllowed(): boolean {
  const ctx = useContext(OrientationContext)
  return (ctx?.allowedCount ?? 0) > 0
}
