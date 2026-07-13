import { useState } from 'react'
import QRCode from 'react-qr-code'

import { createTeam, joinTeam, teamInviteUrl } from '@/lib/session/teams'
import { useMyTeamId, useTeams } from '@/lib/sync/useTeams'

// Shown after a player joins a session with allowTeams=true, while the host
// hasn't started yet. Create or join a team; once in a team, show the team room
// with an invite QR teammates scan with their phone camera.
export function TeamLobby({
  sessionId,
  playerId,
  joinCode,
  notice,
}: {
  sessionId: string
  playerId: string
  joinCode: string
  notice?: string
}) {
  const teams = useTeams(sessionId)
  const myTeamId = useMyTeamId(sessionId, playerId)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(notice ?? null)

  const myTeam = teams.find((t) => t.id === myTeamId)
  const label = (t?: { teamName?: string }) => t?.teamName ?? 'Your team'

  // Team room — already in a team. Show roster + invite QR, wait for host.
  if (myTeamId) {
    const url = teamInviteUrl(joinCode, myTeamId)
    const isOwner = myTeam?.ownerPlayerId === playerId
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-xl font-semibold">{label(myTeam)}</h1>
        <p className="text-sm text-gray-500">
          {myTeam?.memberCount ?? 1} member(s){isOwner ? ' · you own this team' : ''}
        </p>
        <div className="rounded-lg bg-white p-4">
          <QRCode value={url} size={180} />
        </div>
        <p className="max-w-xs text-center text-xs text-gray-500">
          Teammates: scan this with your phone camera to join {label(myTeam)}.
        </p>
        <p className="text-sm text-gray-400">Waiting for host to start…</p>
      </div>
    )
  }

  // No team yet — create or join.
  const create = async () => {
    setBusy(true)
    setErr(null)
    await createTeam(sessionId, playerId, name)
    setBusy(false)
  }

  const join = async (teamId: string) => {
    setBusy(true)
    setErr(null)
    const r = await joinTeam(sessionId, playerId, teamId)
    if (!r.ok) setErr('That team is full.')
    setBusy(false)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-xl font-semibold">Pick a team</h1>

      <div className="flex w-72 flex-col gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New team name"
          className="rounded border px-3 py-2"
        />
        <button
          onClick={create}
          disabled={busy || !name.trim()}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          Create team
        </button>
      </div>

      {teams.length > 0 && (
        <div className="flex w-72 flex-col gap-2">
          <p className="text-sm text-gray-500">or join an existing team</p>
          {teams.map((t) => (
            <button
              key={t.id}
              onClick={() => join(t.id)}
              disabled={busy}
              className="flex justify-between rounded border px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-50"
            >
              <span>{t.teamName ?? 'Team'}</span>
              <span className="text-gray-400">{t.memberCount}</span>
            </button>
          ))}
        </div>
      )}
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  )
}
