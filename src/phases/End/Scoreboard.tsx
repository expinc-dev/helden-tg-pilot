import clsx from 'clsx'

import { type ScoreMap, rankedRows } from '@/lib/sync/useScoreboard'

// Final-score board shared by the session-end screen (pages/extra/end-screen)
// and the end phase renderer — same rows, two chromes. Data arrives as the two
// boundary-flushed maps; this component subscribes to nothing itself, so the
// caller decides which (if any) name lookups to pay for.
export function Scoreboard({
  scores,
  teamScores,
  teamLabels = {},
  variant,
  emptyText,
}: {
  scores: ScoreMap
  teamScores: ScoreMap
  teamLabels?: Record<string, string>
  variant: 'light' | 'dark'
  emptyText: string
}) {
  const dark = variant === 'dark'
  const sections = [
    { key: 'teams', label: 'Teams', rows: rankedRows(teamScores, teamLabels), mono: false },
    { key: 'players', label: 'Players', rows: rankedRows(scores), mono: true },
  ].filter((section) => section.rows.length > 0)

  if (sections.length === 0) {
    return <p className={clsx('text-sm', dark ? 'text-white/40' : 'text-gray-400')}>{emptyText}</p>
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {sections.map((section) => (
        <section key={section.key} className="flex flex-col gap-2">
          <p
            className={clsx(
              'text-xs tracking-wide uppercase',
              dark ? 'text-white/40' : 'text-gray-500'
            )}
          >
            {section.label}
          </p>

          {section.rows.map((row, i) => (
            <div
              key={row.id}
              className={clsx(
                'flex items-center justify-between rounded px-3 py-2 text-sm',
                dark ? 'border border-white/10 bg-white/5 text-white' : 'border'
              )}
            >
              <span className="flex items-center gap-3">
                <span className={clsx('w-6 text-right', dark ? 'text-white/50' : 'text-gray-400')}>
                  {i + 1}.
                </span>
                <span className={clsx(section.mono && 'font-mono text-xs')}>{row.label}</span>
              </span>
              <span className={clsx('font-mono tabular-nums', dark && 'text-helden-accent')}>
                {Math.round(row.score)} pts
              </span>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
