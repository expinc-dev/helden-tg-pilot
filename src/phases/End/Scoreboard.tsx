import clsx from 'clsx'

import { usePlayerNameLabels } from '@/lib/sync/usePlayerNameLabels'
import { type ScoreMap, rankedRows } from '@/lib/sync/useScoreboard'
import { useTeams } from '@/lib/sync/useTeams'

// Final-score board shared by the session-end screen (pages/extra/end-screen)
// and the end phase renderer — same rows, two chromes.
//
// It owns its own name lookups rather than taking them as props: the board used
// to accept teamLabels and silently show raw p_… ids for players, which is how
// every caller ended up shipping ids to the audience. Both lookups are narrow —
// teams/ once, and one listener per id actually present in `scores` — so the
// player role may render this without subscribing to broad session state
// (BLUEPRINT_runtime §5 listener scoping).
export function Scoreboard({
  sessionId,
  scores,
  teamScores,
  variant,
  emptyText,
}: {
  sessionId: string
  scores: ScoreMap
  teamScores: ScoreMap
  variant: 'light' | 'dark'
  emptyText: string
}) {
  const teams = useTeams(sessionId)
  const teamLabels = Object.fromEntries(teams.map((t) => [t.id, t.teamName ?? t.id]))
  const playerLabels = usePlayerNameLabels(sessionId, Object.keys(scores))
  const dark = variant === 'dark'
  const sections = [
    { key: 'teams', label: 'Teams', rows: rankedRows(teamScores, teamLabels) },
    { key: 'players', label: 'Players', rows: rankedRows(scores, playerLabels) },
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
                <span>{row.label}</span>
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
