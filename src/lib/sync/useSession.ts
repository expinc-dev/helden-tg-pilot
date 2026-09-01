import { useEffect, useState } from 'react'

import type {
  CentralPresence,
  PlayerPresence,
  SessionConfig,
  SessionMeta,
} from '@helden-inc/tg-schema'
import { onValue } from 'firebase/database'

import { eref } from '@/lib/firebase'

export function useSessionMeta(sessionId: string | undefined) {
  const [meta, setMeta] = useState<SessionMeta | null>(null)
  useEffect(() => {
    if (!sessionId) return
    return onValue(eref(`sessions/${sessionId}/meta`), (s) => setMeta(s.val()))
  }, [sessionId])
  return meta
}

export function useSessionConfig(sessionId: string | undefined) {
  const [config, setConfig] = useState<SessionConfig | null>(null)
  useEffect(() => {
    if (!sessionId) return
    return onValue(eref(`sessions/${sessionId}/config`), (s) => setConfig(s.val()))
  }, [sessionId])
  return config
}

// Per the runtime sync contract: usePresence(sessionId): { players, centrals }.
// Broad by design (whole players/ + centrals/ trees) — intentionally for
// host/central only (BLUEPRINT_runtime §5: "Host subscribes to presence... the
// only role that watches broad state"). Players must never call this; they read
// their own players/{id} node (and, for team relation, their own teamId leaf)
// directly instead — see useTeamRole/useTeams.
export function usePresence(sessionId: string | undefined) {
  const [players, setPlayers] = useState<Record<string, PlayerPresence>>({})
  const [centrals, setCentrals] = useState<Record<string, CentralPresence>>({})
  useEffect(() => {
    if (!sessionId) return
    const off1 = onValue(eref(`sessions/${sessionId}/players`), (s) => setPlayers(s.val() ?? {}))
    const off2 = onValue(eref(`sessions/${sessionId}/centrals`), (s) => setCentrals(s.val() ?? {}))
    return () => {
      off1()
      off2()
    }
  }, [sessionId])
  return { players, centrals }
}

export function usePresenceCounts(sessionId: string | undefined) {
  const { players, centrals } = usePresence(sessionId)
  return {
    players: Object.values(players).filter((p) => p.connected).length,
    centrals: Object.values(centrals).filter((c) => c.connected).length,
  }
}
