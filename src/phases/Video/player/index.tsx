import { assets } from '@/assets'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

import { useMyTeamId, useTeams } from '@/lib/sync/useTeams'

export function PlayerFoldIn({
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
      <DotLottieReact src={assets.lotties.heldenLogo} autoplay loop className="h-25 w-auto" />
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
