import QRCode from 'react-qr-code'

import { assets } from '@/assets'
import { FullscreenToggle } from '@/components/FullscreenToggle'
import { HeldenLogoLotties } from '@/components/HeldenLogoLotties'
import { PlayerRows, StatTile, TeamList } from '@/pages/host/_shared/Roster'
import type { IdleContent, PlayerPresence } from '@helden-inc/tg-schema'

import { usePresence, useSessionConfig } from '@/lib/sync/useSession'
import { useMyTeamId, useTeams } from '@/lib/sync/useTeams'

import type { Role } from './PhaseRouter'

export function IdleRenderer({
  content,
  role,
  phaseId,
  sessionId,
  playerId,
  allowTeams,
  onAdvance,
}: {
  content: IdleContent
  role: Role
  phaseId: string
  sessionId: string
  playerId?: string
  allowTeams?: boolean
  onAdvance?: () => void
}) {
  if (role === 'central') {
    return <CentralIdleScreen sessionId={sessionId} />
  }

  if (role === 'player') {
    return <PlayerIdleScreen sessionId={sessionId} playerId={playerId} allowTeams={allowTeams} />
  }

  if (role === 'host') {
    return <HostIdleScreen sessionId={sessionId} allowTeams={allowTeams} onAdvance={onAdvance} />
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16">
      <div className="text-4xl">💤</div>
      <p className="text-lg">{content.caption ?? 'Waiting…'}</p>
      <p className="text-xs text-gray-400">
        {role} · {phaseId}
      </p>
    </div>
  )
}

// Same lobby look as WaitingScreen (logo + QR to join), minus the "N Pemain
// telah bergabung" bar — mid-session idle isn't the join window anymore.
function CentralIdleScreen({ sessionId }: { sessionId: string }) {
  const config = useSessionConfig(sessionId)
  const joinUrl = config?.joinCode
    ? `${window.location.origin}/join/player?code=${config.joinCode}`
    : null

  return (
    <div
      className="flex min-h-screen flex-col items-center bg-neutral-950 bg-cover bg-center p-8"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.central})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <FullscreenToggle />

      <div className="flex flex-1 items-center justify-center gap-10">
        <HeldenLogoLotties className="h-52 w-auto" />

        {joinUrl && (
          <>
            <div className="h-40 w-px bg-white/30" />

            <div className="flex flex-col items-center gap-2 rounded-xl bg-white p-4">
              <QRCode value={joinUrl} size={128} />
              <p className="text-xs text-neutral-500">scan to play</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Passive screen shown to a player during mid-session idle (e.g. host is
// picking the next level in modular flow). Layout mirrors Video's
// PlayerFoldIn: Helden logo top, "look at the main screen" prompt, team pill
// at the bottom (only when this session has team mode on and a team assigned).
function PlayerIdleScreen({
  sessionId,
  playerId,
  allowTeams,
}: {
  sessionId: string
  playerId: string | undefined
  allowTeams: boolean | undefined
}) {
  const myTeamId = useMyTeamId(sessionId, playerId ?? '')
  const teams = useTeams(sessionId)
  const myTeam = myTeamId ? teams.find((t) => t.id === myTeamId) : undefined
  const teamName = allowTeams && myTeam?.teamName ? myTeam.teamName : undefined

  return (
    <div
      className="relative flex min-h-dvh w-full flex-col items-center bg-neutral-950 bg-cover bg-center p-6"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.player})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <HeldenLogoLotties className="h-25 w-auto" />
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <h1
          className="text-3xl font-bold text-white sm:text-4xl"
          style={{ textShadow: '0 0 16px rgba(255, 255, 255, 0.5)' }}
        >
          Perhatikan <span className="text-[#FFB800]">Layar Utama</span>
        </h1>
      </div>
      {teamName && (
        <div className="mb-10 rounded-full bg-white/5 px-4 py-2 text-sm text-white/80">
          Tim {teamName}
        </div>
      )}
    </div>
  )
}

// Host's view during mid-session idle: same "who's connected" roster as the
// pre-session Lobby (reused StatTile/TeamList/PlayerRows), restyled as a
// single connected-count stat instead of the lobby's 3-tile grid. The button
// advances the session the same way the host's other live-phase controls do.
function HostIdleScreen({
  sessionId,
  allowTeams,
  onAdvance,
}: {
  sessionId: string
  allowTeams: boolean | undefined
  onAdvance: (() => void) | undefined
}) {
  const { players } = usePresence(sessionId)
  const teams = useTeams(sessionId)
  const playerEntries = Object.entries(players) as [string, PlayerPresence][]
  const connected = playerEntries.filter(([, p]) => p.connected).length

  return (
    <div
      className="relative flex min-h-dvh w-full flex-col items-center gap-6 bg-neutral-950 bg-cover bg-center p-3 sm:p-8"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.auth})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'top',
      }}
    >
      <FullscreenToggle position="absolute" />

      <div className="flex flex-col items-center gap-2">
        <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white/80">
          Host
        </span>
        <HeldenLogoLotties className="h-10 w-auto" />
      </div>

      <div className="text-center">
        <h1 className="text-xl font-bold text-white sm:text-2xl">Menunggu Peserta Terhubung..</h1>
        <p className="mx-auto mt-2 max-w-md text-xs text-white/70 sm:text-sm">
          Mulai sesi setelah seluruh pemain bergabung
        </p>
      </div>

      <StatTile label="Peserta Terhubung" value={`${connected}/${playerEntries.length}`} />

      <div className="flex w-full flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-white/5 bg-[#121212] p-4 sm:p-6">
        {allowTeams ? (
          <TeamList players={playerEntries} teams={teams} />
        ) : playerEntries.length === 0 ? (
          <p className="px-1 text-xs text-white/50">Belum ada pemain yang bergabung.</p>
        ) : (
          <PlayerRows players={playerEntries} />
        )}
      </div>

      <button
        type="button"
        onClick={onAdvance}
        className="w-full rounded-lg bg-[#FFB800] py-4 text-center text-base font-bold text-black sm:py-[18px] sm:text-lg"
      >
        Mulai Permainan
      </button>
    </div>
  )
}
