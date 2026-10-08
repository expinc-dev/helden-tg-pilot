import type { CSSProperties } from 'react'

import { assets } from '@/assets'
import { FitText } from '@/components/FitText'

export type ResultRow = {
  id: string
  letter: string
  label: string
  count: number
  highlight: boolean
}

// Central results board: the question top-left, one row per option (lettered
// circle, label, count, distribution bar) with the highlighted row tinted
// yellow, and a footer with the answered-progress bar + counter. Used for the
// kahoot reveal and for scale statements once votes exist.
//
// Sizing: every dimension is a multiple of --u, which equals 1px of the Figma
// 1920×1080 frame (1vw/19.2) but is capped by the viewport height (1vh*16/9/19.2
// ≈ 1.7778vh/19.2), so the board scales to any projector and never grows taller
// than the screen on 4:3 / 16:10 either. The prompt is a FitText so a long
// statement shrinks instead of pushing the rows off-screen; the panel keeps
// overflow-y-auto only as a last resort for many-point scales.
const u = (n: number) => `calc(var(--u) * ${n})`

export function ResultsBoard({
  prompt,
  rows,
  answered,
  total,
}: {
  prompt: React.ReactNode
  rows: ResultRow[]
  answered: number
  total: number
}) {
  const pct = (n: number) => (total > 0 ? Math.min(100, (n / total) * 100) : 0)

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={
        {
          '--u': 'min(calc(1vw / 19.2), calc(1vh * 16 / 9 / 19.2))',
          gap: u(16),
          padding: '3%',
          backgroundImage: `url(${assets.images.backgrounds.central})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } as CSSProperties
      }
    >
      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-md border"
        style={{
          borderColor: '#353535',
          background: 'rgba(8, 8, 8, 0.55)',
          gap: u(32),
          padding: `${u(32)} 5%`,
        }}
      >
        <FitText
          baseVw={2.5}
          minRatio={0.5}
          className="max-h-[30%] shrink-0 leading-tight font-medium text-white"
        >
          {prompt}
        </FitText>

        <div className="flex flex-col" style={{ gap: u(16) }}>
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-col rounded-sm"
              style={{
                gap: u(12),
                padding: `${u(24)} ${u(32)}`,
                ...(row.highlight
                  ? { background: 'rgba(253, 219, 0, 0.1)' }
                  : { border: '1px solid #353535', background: 'rgba(8, 8, 8, 0.4)' }),
              }}
            >
              <div className="flex items-center" style={{ gap: u(24) }}>
                <span
                  className="flex shrink-0 items-center justify-center rounded-full border-2 font-medium"
                  style={{
                    width: u(48),
                    height: u(48),
                    fontSize: u(24),
                    borderColor: '#FDDB00',
                    background: row.highlight ? '#FDDB00' : 'transparent',
                    color: row.highlight ? '#000' : '#FDDB00',
                  }}
                >
                  {row.letter}
                </span>
                <span className="flex-1 font-semibold text-white" style={{ fontSize: u(30) }}>
                  {row.label}
                </span>
                <span className="font-medium text-white tabular-nums" style={{ fontSize: u(30) }}>
                  {row.count}
                </span>
              </div>
              <div
                className="overflow-hidden rounded-full bg-[#353535]"
                style={{ marginLeft: u(72), height: u(16) }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct(row.count)}%`,
                    background: row.highlight ? '#FDDB00' : '#6B6B6B',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="flex shrink-0 items-center rounded-sm border"
        style={{
          borderColor: '#353535',
          background: 'rgba(8, 8, 8, 0.55)',
          gap: u(24),
          padding: u(8),
        }}
      >
        <div className="flex-1 overflow-hidden rounded-sm bg-white/5" style={{ height: u(32) }}>
          <div
            className="bg-helden-yellow-gradient h-full transition-all duration-500"
            style={{ width: `${pct(answered)}%` }}
          />
        </div>
        <p className="shrink-0 text-white" style={{ fontSize: u(24), paddingRight: u(16) }}>
          <span className="text-helden-yellow font-semibold">{answered}</span> dari{' '}
          <span className="text-helden-yellow font-semibold">{total}</span> pemain telah menjawab
        </p>
      </div>
    </div>
  )
}
