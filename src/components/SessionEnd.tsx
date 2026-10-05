import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { assets } from '@/assets'
import { HostScreenFrame } from '@/pages/host/_shared/HostScreenFrame'
import { Icon } from '@iconify/react'

import { usePlayerNameLabels } from '@/lib/sync/usePlayerNameLabels'
import { type ScoreRow, rankedRows, useScoreMaps } from '@/lib/sync/useScoreboard'
import { useTeams } from '@/lib/sync/useTeams'

import { CentralGalleryFrame } from './CentralGalleryFrame'
import { GradientButton } from './GradientButton'
import { PlayerAppBar } from './PlayerAppBar'

// One closing screen for every role and both entry points: the session being
// ended (meta.status === 'ended') and the authored End phase. Helden style —
// glass panels with a #353535 outline, a gold-gradient title, a podium for the
// top three and a ranked list below it.
//
// The markup is laid out at phone/tablet size; the projector wraps it in a CSS
// zoom that follows the viewport width (see useWallZoom), so the same screen is
// readable from the back of a room at 1920×1080.

const GOLD = 'linear-gradient(167deg, rgb(253, 219, 0) 14.619%, rgb(253, 164, 0) 68.407%)'
const BORDER = '#353535'

type Role = 'host' | 'central' | 'player'

export function SessionEnd({
  role,
  sessionId,
  title,
  subtitle,
  imageUrl,
  playerId,
  teamId,
  embedded = false,
}: {
  role: Role
  sessionId: string
  title?: string
  subtitle?: string
  imageUrl?: string
  // The viewing player (player role only) — drives the "Hasilmu" card.
  playerId?: string
  teamId?: string
  // Host only: render just the content, inside a shell that already exists
  // (the End phase sits in the live host card with its own advance button).
  embedded?: boolean
}) {
  const heading = title || 'Sesi Berakhir'
  const sub = subtitle || 'Terima kasih sudah ikut berlatih bersama Helden.'
  const board = <EndBoard sessionId={sessionId} role={role} playerId={playerId} teamId={teamId} />

  if (role === 'central') {
    return (
      <CentralGalleryFrame title={heading} subtitle={sub}>
        <CentralBody imageUrl={imageUrl}>{board}</CentralBody>
      </CentralGalleryFrame>
    )
  }

  if (role === 'player') {
    return (
      <div
        className="flex min-h-dvh flex-col bg-[#1e1e1e] bg-cover bg-top"
        style={{ backgroundImage: `url(${assets.images.backgrounds.auth})` }}
      >
        <PlayerAppBar />
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pt-8 pb-12 text-base">
          <Hero title={heading} subtitle={sub} />
          {imageUrl && <HeroImage src={imageUrl} />}
          {board}
        </div>
      </div>
    )
  }

  // host
  const content = (
    <div className="flex min-h-0 flex-1 flex-col gap-8 text-base">
      <Hero title={heading} subtitle={sub} />
      {imageUrl && <HeroImage src={imageUrl} />}
      {board}
    </div>
  )
  if (embedded) return content
  return <HostEndShell>{content}</HostEndShell>
}

function HostEndShell({ children }: { children: React.ReactNode }) {
  const nav = useNavigate()
  return (
    <HostScreenFrame
      badge="Selesai"
      footer={
        <GradientButton
          onClick={() => nav('/host/new', { replace: true })}
          className="h-16 w-full shrink-0 text-lg font-medium tracking-[-0.04em]"
        >
          Kembali ke Beranda
        </GradientButton>
      }
    >
      {children}
    </HostScreenFrame>
  )
}

function Hero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span
        className="flex size-14 items-center justify-center rounded-full border-2 bg-white/5"
        style={{ borderColor: '#fddb00' }}
      >
        <Icon icon="mdi:flag-checkered" className="size-7 text-[#fddb00]" />
      </span>
      <h1
        className="bg-clip-text text-3xl leading-[1.2] font-bold tracking-[-0.04em] text-transparent"
        style={{ backgroundImage: GOLD }}
      >
        {title}
      </h1>
      <p className="max-w-md text-base leading-[1.3] font-light tracking-[-0.04em] text-[#ccc]">
        {subtitle}
      </p>
    </div>
  )
}

function HeroImage({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      className="mx-auto max-h-[14em] w-auto rounded-2xl border object-contain"
      style={{ borderColor: BORDER }}
    />
  )
}

// ── Scores ───────────────────────────────────────────────────────────────────

function EndBoard({
  sessionId,
  role,
  playerId,
  teamId,
}: {
  sessionId: string
  role: Role
  playerId?: string
  teamId?: string
}) {
  const { scores, teamScores } = useScoreMaps(sessionId)
  const teams = useTeams(sessionId)
  const teamLabels = Object.fromEntries(teams.map((t) => [t.id, t.teamName ?? t.id]))
  const playerLabels = usePlayerNameLabels(sessionId, Object.keys(scores))

  const teamRows = rankedRows(teamScores, teamLabels)
  const playerRows = rankedRows(scores, playerLabels)

  if (teamRows.length === 0 && playerRows.length === 0) {
    return (
      <Panel>
        <p className="py-6 text-center text-base font-light text-[#ccc]">
          Belum ada fase berpoin di sesi ini.
        </p>
      </Panel>
    )
  }

  // Teams lead when the session had any; players are listed after them.
  const sections = [
    { key: 'teams', label: 'Peringkat Tim', rows: teamRows },
    { key: 'players', label: 'Peringkat Pemain', rows: playerRows },
  ].filter((s) => s.rows.length > 0)

  const myTeam = teamId ? teamRows.findIndex((r) => r.id === teamId) : -1
  const myPlayer = playerId ? playerRows.findIndex((r) => r.id === playerId) : -1
  const wide = role === 'central'

  return (
    <div className="flex flex-col gap-5">
      {role === 'player' && (myTeam >= 0 || myPlayer >= 0) && (
        <Panel>
          <p className="mb-3 text-sm font-semibold tracking-[-0.04em] text-[#ccc]">Hasilmu</p>
          <div className="flex gap-3">
            {myPlayer >= 0 && (
              <Stat label="Skor kamu" value={playerRows[myPlayer].score} rank={myPlayer + 1} />
            )}
            {myTeam >= 0 && (
              <Stat label="Skor tim" value={teamRows[myTeam].score} rank={myTeam + 1} />
            )}
          </div>
        </Panel>
      )}

      <div
        className={
          wide
            ? sections.length > 1
              ? 'grid grid-cols-2 items-start gap-5'
              : 'mx-auto w-full max-w-[560px]'
            : 'flex flex-col gap-5'
        }
      >
        {sections.map((s, idx) => {
          // Projector: every list gets a podium and stops at 6 places (the wall
          // cannot scroll). Phone / tablet: the leading list gets the podium,
          // the others are plain ranked rows, all places listed.
          const podium = wide || idx === 0
          const rest = podium ? s.rows.slice(3, wide ? 6 : undefined) : s.rows
          return (
            <Panel key={s.key}>
              <p className="mb-4 text-center text-sm font-semibold tracking-[-0.04em] text-[#ccc]">
                {s.label}
              </p>
              {podium && <Podium rows={s.rows.slice(0, 3)} />}
              <RankRows rows={rest} start={podium ? 4 : 1} />
            </Panel>
          )
        })}
      </div>
    </div>
  )
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ borderColor: BORDER, background: 'rgba(8, 8, 8, 0.2)' }}
    >
      {children}
    </div>
  )
}

function Stat({ label, value, rank }: { label: string; value: number; rank: number }) {
  return (
    <div
      className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg border px-4 py-3"
      style={{ borderColor: BORDER, background: 'rgba(253, 219, 0, 0.06)' }}
    >
      <span className="text-xs font-light text-[#ccc]">{label}</span>
      <span className="text-2xl leading-none font-bold text-[#fddb00]">{Math.round(value)}</span>
      <span className="text-xs font-medium text-white/70">Peringkat {rank}</span>
    </div>
  )
}

// 2nd · 1st · 3rd — the winner stands in the middle on the tallest step.
function Podium({ rows }: { rows: ScoreRow[] }) {
  const order = [1, 0, 2].filter((i) => rows[i])
  const height = ['10em', '7.5em', '6em']
  return (
    <div className="mb-5 flex items-end justify-center gap-3">
      {order.map((i) => {
        const r = rows[i]
        const first = i === 0
        return (
          <div key={r.id} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span
              className={`flex items-center justify-center rounded-full font-bold ${
                first
                  ? 'size-[3.25em] border-2 border-[#fddb00] bg-[#fddb00] text-lg text-black'
                  : 'size-[2.75em] border border-[#fddb00] text-base text-[#ccc]'
              }`}
            >
              {i + 1}
            </span>
            <span className="w-full truncate text-center text-sm font-medium tracking-[-0.04em] text-white">
              {r.label}
            </span>
            <div
              className="flex w-full items-start justify-center rounded-t-lg border border-b-0 pt-3"
              style={{
                height: height[i],
                borderColor: first ? '#fddb00' : BORDER,
                background: first
                  ? 'linear-gradient(180deg, rgba(253,219,0,0.22), rgba(253,164,0,0.04))'
                  : 'rgba(255,255,255,0.04)',
              }}
            >
              <span className="text-base font-bold text-[#fddb00]">
                {Math.round(r.score)} <span className="text-xs font-normal text-[#ccc]">poin</span>
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RankRows({ rows, start }: { rows: ScoreRow[]; start: number }) {
  if (rows.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r, i) => (
        <div
          key={r.id}
          className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
          style={{ borderColor: BORDER, background: 'rgba(8, 8, 8, 0.2)' }}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#fddb00] text-sm text-[#ccc]">
              {start + i}
            </span>
            <span className="truncate text-base tracking-[-0.04em] text-white">{r.label}</span>
          </span>
          <span className="shrink-0 text-base font-bold text-[#fddb00] tabular-nums">
            {Math.round(r.score)} poin
          </span>
        </div>
      ))}
    </div>
  )
}

// Zoom factor for the projector layout: 1.5× at 1920 px wide, scaling with the
// viewport so a smaller or larger wall keeps the same proportions.
function useWallZoom() {
  const calc = () => Math.max(1, window.innerWidth / 1180)
  const [zoom, setZoom] = useState(calc)
  useEffect(() => {
    const onResize = () => setZoom(calc())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return zoom
}

function CentralBody({ imageUrl, children }: { imageUrl?: string; children: React.ReactNode }) {
  const zoom = useWallZoom()
  return (
    <div
      className="mx-auto flex min-h-0 w-[1180px] max-w-full flex-col gap-4 overflow-y-auto text-base"
      style={{ zoom, height: '100%' }}
    >
      {imageUrl && <HeroImage src={imageUrl} />}
      {children}
    </div>
  )
}
