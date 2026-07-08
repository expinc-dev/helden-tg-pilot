import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSession } from '@/session/create'

export function HostNew() {
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const create = async () => {
    setBusy(true); setErr(null)
    try {
      const { sessionId } = await createSession()
      nav(`/host/${sessionId}`, { replace: true })
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold">New session</h1>
      <button
        onClick={create}
        disabled={busy}
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
      >
        {busy ? 'Creating…' : 'Create session'}
      </button>
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  )
}
