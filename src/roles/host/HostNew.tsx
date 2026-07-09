import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { createSession } from '@/session/create'

export function HostNew() {
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [allowTeams, setAllowTeams] = useState(false)
  const [maxMembers, setMaxMembers] = useState('')

  const create = async () => {
    setBusy(true)
    setErr(null)
    try {
      const parsed = Number(maxMembers)
      const { sessionId } = await createSession({
        allowTeams,
        maxMembers: allowTeams && parsed > 0 ? parsed : undefined,
      })
      nav(`/host/${sessionId}`, { replace: true })
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold">New session</h1>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={allowTeams}
          onChange={(e) => setAllowTeams(e.target.checked)}
        />
        Allow teams (physical puzzle mode)
      </label>
      {allowTeams && (
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Max members / team
          <input
            type="number"
            min={1}
            value={maxMembers}
            onChange={(e) => setMaxMembers(e.target.value)}
            placeholder="∞"
            className="w-20 rounded border px-2 py-1"
          />
        </label>
      )}
      <button
        onClick={create}
        disabled={busy}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {busy ? 'Creating…' : 'Create session'}
      </button>
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  )
}
