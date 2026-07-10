import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { loadIdentity, loadLastSession } from '@/lib/identity'

import { resolveJoinCode } from './join'

// Shared join screen for player + central. Role from URL param.
export function JoinGate() {
  const { role } = useParams<{ role: 'player' | 'central' }>()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  // Prefill from a scanned team-invite QR: ?code=…&team=…
  const teamParam = sp.get('team')
  const [code, setCode] = useState(sp.get('code')?.toUpperCase() ?? '')
  const [name, setName] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // PlayerView/CentralView already reuse a stored identity for this session
  // over anything typed here (BLUEPRINT_runtime §7 — identity survives refresh).
  // Surface that instead of leaving it hidden. Both reads are plain localStorage
  // (see lib/identity.ts) — no code needed, no network round trip, so Rejoin can
  // render on the very first paint instead of waiting on anything.
  const lastSessionId = role ? loadLastSession(role) : null
  const existing = lastSessionId && role ? loadIdentity(lastSessionId, role) : null

  const rejoin = () => {
    if (!lastSessionId || !role) return
    nav(`/${role}/${lastSessionId}`, { replace: true })
  }

  const joinByCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    const sid = await resolveJoinCode(code)
    if (!sid) {
      setErr('Invalid code')
      setBusy(false)
      return
    }
    const params = new URLSearchParams()
    if (role === 'player' && name) params.set('name', name)
    if (role === 'player' && teamParam) params.set('team', teamParam)
    const q = params.toString() ? `?${params}` : ''
    nav(`/${role}/${sid}${q}`, { replace: true })
  }

  return (
    <form
      onSubmit={joinByCode}
      className="flex min-h-screen flex-col items-center justify-center gap-4 p-8"
    >
      <h1 className="text-xl font-semibold">Join as {role}</h1>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="6-char code"
        maxLength={6}
        autoFocus
        className="w-40 rounded border px-3 py-2 text-center font-mono tracking-widest uppercase"
      />
      {role === 'player' && (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-60 rounded border px-3 py-2"
        />
      )}

      <div className="flex gap-2">
        <button
          disabled={busy || code.length !== 6}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {busy ? 'Joining…' : 'Join'}
        </button>
        {existing && (
          <button
            type="button"
            disabled={busy}
            onClick={rejoin}
            className="rounded border border-black px-4 py-2 text-black disabled:opacity-50"
          >
            {`Rejoin as ${existing.name ?? 'yourself'}`}
          </button>
        )}
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
    </form>
  )
}
