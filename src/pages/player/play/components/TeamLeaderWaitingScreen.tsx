import QRCode from 'react-qr-code'

import { assets } from '@/assets'
import { FullscreenToggle } from '@/components/FullscreenToggle'
import { GradientButton } from '@/components/GradientButton'

import { teamInviteUrl } from '@/lib/session/teams'
import { useTeamMembersPresence } from '@/lib/sync/useTeamMembersPresence'

// Shown to the team owner ("leader") once they've created a team, while the
// host hasn't started yet. Non-owner teammates see PlayerWaitingScreen
// instead — this is the only place a player sees their own team's roster.
// "Mulai Permainan" is always disabled: starting the session is host-only
// (see HostView), this button just mirrors the design's readiness cue.
export function TeamLeaderWaitingScreen({
  sessionId,
  joinCode,
  teamId,
  teamName,
  memberIds,
}: {
  sessionId: string
  joinCode: string
  teamId: string
  teamName: string
  memberIds: string[]
}) {
  const members = useTeamMembersPresence(sessionId, memberIds)
  const inviteUrl = teamInviteUrl(joinCode, teamId)

  console.log('awa', inviteUrl)

  return (
    <div
      className="relative flex min-h-screen w-full flex-col gap-4 bg-neutral-950 bg-cover bg-center p-6"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.player})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <FullscreenToggle position="absolute" />

      <div
        className="flex items-center justify-between gap-4 rounded-[16px] border p-4"
        style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.20)' }}
      >
        <div className="flex flex-col gap-1">
          <h1 className="font-semibold text-orange-400">Bergabung ke Tim!</h1>
          <p className="text-xs text-white/50">
            Perlihatkan QR tim kepada anggota agar mereka dapat bergabung.
          </p>
        </div>
        <div className="rounded-lg bg-white p-2">
          <QRCode value={inviteUrl} size={80} />
        </div>
      </div>

      <div
        className="flex flex-col overflow-hidden rounded-[16px] border"
        style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.20)' }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: '#181818' }}
        >
          <span className="font-semibold text-orange-400">{teamName}</span>
          <span className="text-xs text-white/60">{memberIds.length} Pemain</span>
        </div>
        <div className="flex flex-col gap-2 p-3">
          {memberIds.map((id) => {
            const member = members[id]
            return (
              <div
                key={id}
                className="flex items-center justify-between rounded-[8px] border px-4 py-3"
                style={{ borderColor: '#353535', background: '#1B1B1B' }}
              >
                <span className="text-sm text-white/90">{member?.name ?? '…'}</span>
                <span className="flex items-center gap-1.5 text-xs text-green-400">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${member?.connected ? 'bg-green-400' : 'bg-white/30'}`}
                  />
                  <span className={member?.connected ? 'text-green-400' : 'text-white/40'}>
                    {member?.connected ? 'Online' : 'Offline'}
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <GradientButton disabled className="mt-auto w-full py-3">
        Mulai Permainan
      </GradientButton>
    </div>
  )
}
