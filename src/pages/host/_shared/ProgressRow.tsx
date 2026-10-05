import type { ReactNode } from 'react'

import { Icon } from '@iconify/react'

// Absolute status, not a proportional arc: green once fully done, red once
// clearly falling behind, gold in between — a host scanning the list should
// be able to spot a stuck player by colour alone.
function badgeColor(pct: number): string {
  if (pct >= 100) return '#22C55E'
  if (pct >= 50) return '#FFB800'
  return '#EF4444'
}

// 72px ring (Figma "Progres Tim"): coloured arc = progress, dim track, %
// centred in white.
export function ProgressRing({ pct }: { pct: number }) {
  const color = badgeColor(pct)
  return (
    <span
      className="relative flex size-[72px] shrink-0 items-center justify-center rounded-full"
      style={{ background: `conic-gradient(${color} ${pct}%, rgba(255,255,255,0.12) 0)` }}
    >
      <span className="absolute inset-1 rounded-full bg-[#101010]" />
      <span className="relative text-lg font-bold tracking-[0.04em] text-white">{pct}%</span>
    </span>
  )
}

// One 104px row of the team/player progress list (0.5px white border, soft
// gold glow). `children` = the left label; the ring sits on the right.
export function ProgressRow({
  pct,
  onClick,
  dim,
  children,
}: {
  pct: number
  onClick?: () => void
  dim?: boolean
  children: ReactNode
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex h-[104px] w-full shrink-0 items-center justify-between rounded-lg border-[0.5px] border-white py-4 pr-6 pl-8 text-left shadow-[0_0_12px_rgba(253,164,0,0.2)] ${dim ? 'opacity-40' : ''}`}
    >
      <span className="flex items-center gap-4 text-2xl tracking-[-0.04em] text-white">
        {children}
      </span>
      <ProgressRing pct={pct} />
    </Tag>
  )
}

export function TeamLabel({ name, count }: { name: string; count?: number }) {
  return (
    <>
      <Icon icon="material-symbols:group-outline-rounded" className="size-6" />
      {name}
      {count !== undefined && <span className="font-light text-[#a2a2a2]">({count} Pemain)</span>}
    </>
  )
}

export function PlayerLabel({ name }: { name: string }) {
  return (
    <>
      <Icon icon="material-symbols:account-circle-outline" className="size-6" />
      {name}
    </>
  )
}

// "1 dari 24 pemain telah mengumpulkan" strip (Figma Progres Tim / Refleksi).
export function SubmittedStrip({
  done,
  total,
  verb = 'mengumpulkan',
  tone = 'tint',
}: {
  done: number
  total: number
  verb?: string
  tone?: 'tint' | 'dark'
}) {
  return (
    <div
      className={`flex w-full shrink-0 items-center justify-center p-6 text-lg text-white ${
        tone === 'tint' ? 'bg-[rgba(253,219,0,0.08)]' : 'border border-[#353535] bg-black'
      }`}
    >
      <p>
        <span className="font-bold text-[#fddb00]">{done} </span>dari
        <span className="font-bold text-[#fddb00]"> {total} </span>
        pemain telah {verb}
      </p>
    </div>
  )
}
