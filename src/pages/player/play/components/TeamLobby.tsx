import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { assets } from '@/assets'
import { FullscreenToggle } from '@/components/FullscreenToggle'
import { GradientButton } from '@/components/GradientButton'
import { HeldenLogoLotties } from '@/components/HeldenLogoLotties'
import { MessageModal } from '@/components/MessageModal'

import { createTeam, joinTeam } from '@/lib/session/teams'
import { useTeams } from '@/lib/sync/useTeams'

// Shown after a player joins a session with allowTeams=true, while the host
// hasn't started yet and before the player has picked a team. Once a team is
// assigned, PlayerView renders PlayerWaitingScreen instead of this.
export function TeamLobby({
  sessionId,
  playerId,
  notice,
}: {
  sessionId: string
  playerId: string
  notice?: string
}) {
  const nav = useNavigate()
  const teams = useTeams(sessionId)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(notice ?? null)

  const backToLanding = () => nav('/')
  const dismissErr = () => setErr(null)

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
    <div
      className="relative flex min-h-screen w-full flex-col bg-neutral-950 bg-cover bg-center p-6"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.player})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <FullscreenToggle position="absolute" />

      <HeldenLogoLotties className="h-6 w-auto self-start" />

      <div className="mt-auto flex w-full flex-col gap-4">
        <h1 className="text-center text-lg font-semibold text-white">Pick a team</h1>

        <div
          className="flex w-full flex-col gap-4 rounded-[16px] border p-4"
          style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.20)' }}
        >
          <div className="flex w-full flex-col gap-2">
            <label htmlFor="team-name" className="text-sm text-white/70">
              New team name
            </label>
            <input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New team name"
              className="w-full rounded-[8px] border px-4 py-3 text-white placeholder:text-white/30"
              style={{ borderColor: '#353535', background: '#1B1B1B' }}
            />
          </div>

          <GradientButton onClick={create} disabled={busy || !name.trim()} className="w-full py-3">
            Create team
          </GradientButton>

          {teams.length > 0 && (
            <div className="flex flex-col gap-2 border-t pt-4" style={{ borderColor: '#353535' }}>
              <p className="text-sm text-white/50">or join an existing team</p>
              {teams.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => join(t.id)}
                  disabled={busy}
                  className="flex items-center justify-between rounded-[8px] border px-4 py-3 text-left text-white disabled:opacity-50"
                  style={{ borderColor: '#353535', background: '#1B1B1B' }}
                >
                  <span>{t.teamName ?? 'Team'}</span>
                  <span className="text-white/40">{t.memberCount}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {err && (
        <MessageModal
          title="Ups! Tim Penuh"
          message={err}
          onBack={backToLanding}
          onDismiss={dismissErr}
        />
      )}
    </div>
  )
}
