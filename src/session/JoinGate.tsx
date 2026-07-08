import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { resolveJoinCode } from './join'

// Shared join screen for player + central. Role from URL param.
export function JoinGate() {
  const { role } = useParams<{ role: 'player' | 'central' }>()
  const nav = useNavigate()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr(null)
    const sid = await resolveJoinCode(code)
    if (!sid) { setErr('Invalid code'); setBusy(false); return }
    const q = role === 'player' && name ? `?name=${encodeURIComponent(name)}` : ''
    nav(`/${role}/${sid}${q}`, { replace: true })
  }

  return (
    <form onSubmit={submit} className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold">Join as {role}</h1>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="6-char code"
        maxLength={6}
        autoFocus
        className="border rounded px-3 py-2 font-mono tracking-widest uppercase text-center w-40"
      />
      {role === 'player' && (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="border rounded px-3 py-2 w-60"
        />
      )}
      <button disabled={busy || code.length !== 6} className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">
        {busy ? 'Joining…' : 'Join'}
      </button>
      {err && <p className="text-sm text-red-600">{err}</p>}
    </form>
  )
}
