import { createContext, useContext } from 'react'

import type { AdvanceSource } from '@/lib/session/advanceGate'

// Context + hooks for the host advance gate. Split from the Provider component
// so react-refresh (Fast Refresh) keeps working — its only-export-components
// rule bans mixing non-component exports with component exports in one file.
// The Provider (and the "Memindahkan…" overlay) live in AdvanceGateProvider.tsx.

export interface AdvanceApi {
  // Runs `fn` as the advance off `phaseId` unless the gate refuses it. Returns
  // whether it started. `manual` (default) = a human tap, subject to the dwell
  // after a phase change; `auto` = timer expiry / code solved, never dwelled.
  run: (phaseId: string | undefined, fn: () => Promise<unknown>, source?: AdvanceSource) => boolean
  // Tell the gate which phase the RTDB pointer is on.
  observe: (phaseId: string | undefined) => void
  // An advance is running or the post-change dwell is on: advance controls
  // should render disabled.
  locked: boolean
}

export const AdvanceContext = createContext<AdvanceApi | null>(null)

export function useAdvanceGate(): AdvanceApi {
  const ctx = useContext(AdvanceContext)
  if (!ctx) throw new Error('useAdvanceGate must be used inside <AdvanceGateProvider>')
  return ctx
}

// Safe outside the provider (false): a shared advance button can be rendered by
// previews/tests that never mount the host page.
export function useAdvanceLocked(): boolean {
  return useContext(AdvanceContext)?.locked ?? false
}
