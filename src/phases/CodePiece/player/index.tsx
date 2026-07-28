import { assets } from '@/assets'
import type { CodePieceContent } from '@helden-inc/tg-schema'

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
        <p className="text-sm text-white/50">Menunggu bagian kodemu...</p>
      </CodePieceShell>
    )
  }

  const resolved = fragmentForPosition(content, position)

  return (
    <CodePieceShell title={title}>
      <p className="text-sm text-white/50">
        Bagian {position + 1} dari {order.length}
      </p>
      {resolved && <LetterSlots {...fragmentSlots(content, resolved.index)} />}
      {content.hint && <p className="text-xs text-white/40">{content.hint}</p>}
      <p className="max-w-xs text-xs text-white/30">
        Gabungkan dengan bagian tim lainnya, lalu masukkan kode lengkapnya di fase berikutnya.
      </p>
    </CodePieceShell>
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
      className="flex flex-wrap items-center justify-center gap-1.5"
    >
      {cells.map((ch, i) => (
        <div
          key={i}
          className={`flex size-10 items-center justify-center rounded-lg border font-mono text-xl font-bold ${
            ch
              ? 'border-[#FFB800] bg-[#FFB800]/10 text-[#FFB800]'
              : 'border-white/10 bg-[#1C1C1E] text-white/20'
          }`}
        >
          {ch ?? '–'}
        </div>
      ))}
    </div>
  )
}

// Same background-image + card language as the other phase shells
// (StepShell / ReflectionShell / SortOrderShell) — a single static card,
// no footer action needed since there's nothing to submit here.
function CodePieceShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-cover bg-top p-6 text-center"
      style={{ backgroundImage: `url(${assets.images.backgrounds.auth})` }}
    >
      <div className="h-1 w-8 rounded-full bg-[#FFB800]" />
      <h1 className="text-xl font-bold text-[#FFB800]">{title}</h1>
      {children}
    </div>
  )
}
