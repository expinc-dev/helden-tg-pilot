import type { ReactNode } from 'react'

import { Icon } from '@iconify/react'

import { OPTION_COLORS, OPTION_ICONS } from '../../lib'

// Figma host quiz screens (834×1194): a full-width "1/4" counter bar, then a
// 32px-padded body (timer ring, question, option rows, answered strip). The
// pieces below are shared by the answering, reveal and scale layouts.

const LABEL = 'tracking-[-0.04em]'

export function QuestionCounter({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex shrink-0 items-center border border-[#353535] bg-[#181818] px-6 py-4">
      <p className={`text-[32px] font-bold ${LABEL} text-[#fddb00]`}>
        {step}
        <span className="font-normal text-white">/{total}</span>
      </p>
    </div>
  )
}

export function AnsweredStrip({ answered, total }: { answered: number; total: number }) {
  return (
    <div className="flex w-full shrink-0 items-center justify-center bg-[rgba(253,219,0,0.08)] p-6 text-lg text-white">
      <p>
        <span className="font-bold text-[#fddb00]">{answered} </span>dari
        <span className="font-bold text-[#fddb00]"> {total} </span>
        pemain telah menjawab
      </p>
    </div>
  )
}

// The question text, 24px by default, 32px on the (text-only) scale screen.
export function QuestionText({ children, large }: { children: ReactNode; large?: boolean }) {
  return (
    <p
      className={`w-full leading-[1.4] font-normal text-[#ccc] ${
        large ? 'text-[32px] tracking-[-0.04em]' : 'text-2xl tracking-[-0.04em]'
      }`}
    >
      {children}
    </p>
  )
}

// Quiz panel + the single action button below it (Figma: card, 40px gap,
// 64px gradient button). Rendered by every quiz stage.
export function QuizHostShell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <>
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl border border-[#353535] bg-[rgba(8,8,8,0.2)] pb-8">
        {children}
      </div>
      {footer}
    </>
  )
}

// `fill` set = filled disc with a bold black letter (highlighted row).
export function Letter({ letter, fill }: { letter: string; fill?: string }) {
  return (
    <span
      className="flex size-[26px] shrink-0 items-center justify-center rounded-full border p-0.5 text-base leading-[23px]"
      style={
        fill
          ? { background: fill, borderColor: fill, color: '#000', fontWeight: 700 }
          : { borderColor: '#fddb00', color: '#ccc', fontWeight: 300 }
      }
    >
      {letter}
    </span>
  )
}

// Row used by the answering list (plain) and the scale distribution (bar +
// count). `accent` colours the bar and the row tint of the highlighted row.
export function BarRow({
  letter,
  label,
  count,
  pct,
  accent,
}: {
  letter: string
  label?: string
  count?: number
  pct?: number
  accent?: string
}) {
  return (
    <div
      className="flex items-center gap-4 rounded border border-[#353535] p-6"
      style={
        accent
          ? {
              background: accent === '#51ce92' ? 'rgba(81,206,146,0.05)' : 'rgba(253,219,0,0.05)',
            }
          : undefined
      }
    >
      <Letter letter={letter} fill={accent} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {label && (
          <p className={`text-white ${LABEL} ${label.length > 160 ? 'text-base' : 'text-lg'}`}>
            {label}
          </p>
        )}
        {pct !== undefined && (
          <div className="relative h-4 w-full overflow-hidden rounded bg-[#313131]">
            <div
              className="absolute inset-y-0 left-0 transition-all duration-500"
              style={{ width: `${pct}%`, background: accent ?? '#515150' }}
            />
          </div>
        )}
      </div>
      {count !== undefined && (
        <p className="w-10 shrink-0 text-center text-lg font-semibold text-white">{count}</p>
      )}
    </div>
  )
}

// Kahoot-style option (two big colour tiles): coloured shape block on the
// left, label and — once revealed — a bar and count. `state` drives the
// green/red verdict colours of the reveal.
export function TileRow({
  index,
  label,
  count,
  pct,
  state,
}: {
  index: number
  label: string
  count?: number
  pct?: number
  state?: 'correct' | 'wrong'
}) {
  const color = OPTION_COLORS[index % OPTION_COLORS.length].bg
  const accent = state === 'correct' ? '#51ce92' : state === 'wrong' ? '#e4456d' : undefined
  return (
    <div
      className="relative flex min-h-[110px] shrink-0 items-center gap-6 overflow-hidden rounded-lg border-2 py-10 pr-6 pl-[160px]"
      style={{
        borderColor: accent ?? '#353535',
        background:
          state === 'correct'
            ? 'rgba(81,206,146,0.05)'
            : state === 'wrong'
              ? 'linear-gradient(rgba(228,69,109,0.1),rgba(228,69,109,0.1)),#1e1e1d'
              : 'transparent',
      }}
    >
      <div
        className="absolute inset-y-0 left-0 flex w-[134px] items-center justify-center"
        style={{ background: color }}
      >
        <Icon icon={OPTION_ICONS[index % OPTION_ICONS.length]} className="size-12 text-white" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">
        <p className={`leading-[1.3] text-white ${label.length > 160 ? 'text-lg' : 'text-2xl'}`}>
          {label}
        </p>
        {pct !== undefined && (
          <div className="relative h-4 w-full overflow-hidden rounded bg-[#313131]">
            <div
              className="absolute inset-y-0 left-0 transition-all duration-500"
              style={{ width: `${pct}%`, background: accent ?? '#515150' }}
            />
          </div>
        )}
      </div>
      {count !== undefined && <p className="shrink-0 text-2xl leading-[1.2] text-white">{count}</p>}
    </div>
  )
}
