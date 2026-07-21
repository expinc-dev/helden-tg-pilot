import { assets } from '@/assets'
import { FullscreenToggle } from '@/components/FullscreenToggle'
import { HeldenLogoLotties } from '@/components/HeldenLogoLotties'
import { PlayerRows, StatTile, TeamList } from '@/pages/host/_shared/Roster'
import type { PlayerPresence } from '@helden-inc/tg-schema'

import { usePresence } from '@/lib/sync/useSession'
import { useTeams } from '@/lib/sync/useTeams'

// Host's view during mid-session idle: same "who's connected" roster as the
// pre-session Lobby (reused StatTile/TeamList/PlayerRows), restyled as a
// single connected-count stat instead of the lobby's 3-tile grid. The button
// advances the session the same way the host's other live-phase controls do.
export function HostIdleScreen({
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
