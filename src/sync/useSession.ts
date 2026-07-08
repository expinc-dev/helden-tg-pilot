import { onValue, ref } from 'firebase/database'
import { useEffect, useState } from 'react'
import type { SessionConfig, SessionMeta } from '@helden-inc/tg-schema'
import { rtdb } from '@/lib/firebase'

export function useSessionMeta(sessionId: string | undefined) {
  const [meta, setMeta] = useState<SessionMeta | null>(null)
  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/meta`), (s) => setMeta(s.val()))
  }, [sessionId])
  return meta
}

export function useSessionConfig(sessionId: string | undefined) {
  const [config, setConfig] = useState<SessionConfig | null>(null)
  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/config`), (s) => setConfig(s.val()))
  }, [sessionId])
  return config
}

export function usePresenceCounts(sessionId: string | undefined) {
  const [players, setPlayers] = useState(0)
  const [centrals, setCentrals] = useState(0)
  useEffect(() => {
    if (!sessionId) return
    const off1 = onValue(ref(rtdb, `sessions/${sessionId}/players`), (s) => {
      let n = 0
      s.forEach((c) => { if (c.val()?.connected) n++ })
      setPlayers(n)
    })
    const off2 = onValue(ref(rtdb, `sessions/${sessionId}/centrals`), (s) => {
      let n = 0
      s.forEach((c) => { if (c.val()?.connected) n++ })
      setCentrals(n)
    })
    return () => { off1(); off2() }
  }, [sessionId])
  return { players, centrals }
}
