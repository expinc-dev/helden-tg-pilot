import { TeamFocusLeader } from '../../TeamFocusLeader'
import { HostSubmittedPane } from '../HostSubmittedPane'
import type { MinigameRendererProps } from '../types'
import { JourneyPlayer } from './player'
import type { JourneyConfig } from './score'

// journey template (HLN-014) — the closing personal recap, player surface only.
//
// Player-only is the design, not an omission. Storyboard "Bagian 2 —
// Perjalananmu" gives the phone "ringkasan personal — benih + apa yang dibuat +
// komitmen", and gives the central screen fixed copy the author writes ("Hari
// ini kamu: menulis apa yang paling makan waktu di usahamu · …"). Those are two
// different artifacts: the phone screen is assembled from one participant's own
// answers (and MUST NOT be shown to the room), while the wall screen is authored
// text with no data in it at all.
//
// So the central and host branches return null, and the wall version is built in
// the CMS as an ordinary `content` phase — zero code, and no route by which a
// participant's private recap could end up on the projector. If the recap is
// ever wanted on the wall, it must be authored copy, never this template.
//
// Branch order mirrors the other templates: role first (host/central never have
// a team role), then the team gate, then the missing-identity guard, then the
// player.
export function JourneyRenderer(props: MinigameRendererProps<JourneyConfig>) {
  const { config, phase, sessionId, playerId, role, teamRole } = props

  // Read-only recap of ONE participant's seat. There is no central-safe subset
  // of it, so this branch is deliberately empty rather than a degraded render —
  // see the file comment.
  if (role === 'central') return null
  if (role === 'host')
    return (
      <HostSubmittedPane
        sessionId={sessionId}
        phase={phase}
        title="Ringkasan"
        subtitle="Ringkasan pribadi tampil di HP tiap peserta. Biarkan hening sebentar."
        showCount={false}
      />
    )

  if (teamRole === 'member') return <TeamFocusLeader sessionId={sessionId} playerId={playerId} />

  if (!playerId) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-black/80 p-6 text-center text-white/60">
        <p className="text-sm">Menunggu identitas pemain…</p>
      </div>
    )
  }

  return <JourneyPlayer phase={phase} sessionId={sessionId} writerId={playerId} config={config} />
}
