import { assets } from '@/assets'
import type { CodePieceContent } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { fragmentForPosition, fragmentSlots, useFragmentOrder } from '../lib'

// Read-only display, no submit action — CodePiece's whole job is showing
// each player their own piece; assembling and entering the combined code
// happens on the paired CodeInput phase. Ungraded (no scoring here, matches
// the schema's own fragment shape having no correctness field).
export function CodePiecePlayer({
  content,
  phaseId,
  sessionId,
  playerId,
  teamId,
  title,
}: {
  content: CodePieceContent
  phaseId: string
  sessionId: string
  playerId: string
  teamId: string | undefined
  title: string
}) {
  const order = useFragmentOrder(sessionId, phaseId, teamId)
  const position = order.indexOf(playerId)

  if (position < 0) {
    return (
      <CodePieceShell title={title}>
        <div className="flex min-h-64 flex-col items-center justify-center gap-4">
          <Icon icon="mdi:loading" className="size-8 animate-spin text-[#FDDB00]" />
          <p className="text-sm text-white/50">Menunggu bagian kodemu...</p>
        </div>
      </CodePieceShell>
    )
  }

  const resolved = fragmentForPosition(content, position)

  return (
    <CodePieceShell title={title}>
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-white/10 bg-[#0B0B0C]/80 p-5 shadow-inner">
        <MatrixPadlock />

        <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
          Bagian {position + 1} dari {order.length}
        </div>

        {resolved && (
          <div className="w-full rounded-xl border border-white/10 bg-[#121214] px-4 py-3.5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
            <LetterSlots {...fragmentSlots(content, resolved.index)} />
          </div>
        )}

        <div className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#121214]/60 px-4 py-3 text-xs text-white/60">
          <span>Menunggu central phone mengirimkan kode akhir...</span>
          <Icon icon="mdi:asterisk" className="size-4 animate-spin text-[#FDDB00]" />
        </div>
      </div>

      {content.hint && <p className="mt-4 text-center text-xs text-white/50">{content.hint}</p>}
      <p className="mt-2 text-center text-xs text-white/30">
        Gabungkan dengan bagian tim lainnya, lalu masukkan kode lengkapnya di fase berikutnya.
      </p>
    </CodePieceShell>
  )
}

function MatrixPadlock() {
  return (
    <div className="relative flex items-center justify-center py-2">
      <div className="pointer-events-none absolute size-44 rounded-full bg-[#FDDB00]/10 blur-2xl" />

      <svg
        className="relative size-40 drop-shadow-[0_0_12px_rgba(253,219,0,0.35)]"
        viewBox="0 0 200 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="matrix-dots" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="4" r="1.5" fill="#FDDB00" fillOpacity="0.85" />
          </pattern>
          <mask id="padlock-mask">
            <path
              d="M 60 110 V 65 A 40 40 0 0 1 140 65 V 110"
              fill="none"
              stroke="white"
              strokeWidth="20"
              strokeLinecap="round"
            />
            <rect x="40" y="100" width="120" height="110" rx="16" fill="white" />
          </mask>
        </defs>

        <rect
          x="20"
          y="20"
          width="160"
          height="200"
          fill="url(#matrix-dots)"
          mask="url(#padlock-mask)"
        />

        <circle cx="28" cy="100" r="1.2" fill="#FDDB00" opacity="0.6" />
        <circle cx="172" cy="90" r="1.2" fill="#FDDB00" opacity="0.6" />
        <circle cx="36" cy="140" r="1.5" fill="#FDDB00" opacity="0.5" />
        <circle cx="166" cy="150" r="1.5" fill="#FDDB00" opacity="0.7" />
        <circle cx="100" cy="20" r="1.2" fill="#FDDB00" opacity="0.4" />
      </svg>
    </div>
  )
}

// The FULL code's length, shown as one slot per character — only this
// player's own span filled in, everything else blank — so they can see
// where their piece starts/ends relative to the whole thing instead of an
// isolated string with no sense of position (e.g. "H E L - - -" for the
// first third of a 6-character code).
function LetterSlots({
  totalLength,
  offset,
  value,
}: {
  totalLength: number
  offset: number
  value: string
}) {
  const cells = Array.from({ length: totalLength }, (_, i) =>
    i >= offset && i < offset + value.length ? value[i - offset] : null
  )
  return (
    <div
      data-testid="codepiece-slots"
      className="flex flex-wrap items-center justify-center gap-1.5 font-mono text-2xl font-bold tracking-widest sm:text-3xl"
    >
      {cells.map((ch, i) => (
        <span
          key={i}
          className={
            ch ? 'text-[#FDDB00] drop-shadow-[0_0_8px_rgba(253,219,0,0.6)]' : 'text-white/20'
          }
        >
          {ch ?? '–'}
        </span>
      ))}
    </div>
  )
}

// Same background-image + card language as the other phase shells
// (StepShell / ReflectionShell / SortOrderShell) — a single static card,
// no footer action needed since there's nothing to submit here.
function CodePieceShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center bg-cover bg-top p-4 sm:p-6"
      style={{ backgroundImage: `url(${assets.images.backgrounds.auth})` }}
    >
      <div className="w-full max-w-md rounded-2xl border border-[#353535] bg-black/50 p-6 shadow-2xl backdrop-blur-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {title || 'Fragmen Data Diterima!'}
          </h1>
          <p className="mt-2 text-sm text-white/70">
            {subtitle || 'Tugas tim Anda telah selesai, simpan potongan urutan berikut.'}
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
