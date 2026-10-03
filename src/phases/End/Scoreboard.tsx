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
    { key: 'teams', label: 'Tim', rows: rankedRows(teamScores, teamLabels) },
    { key: 'players', label: 'Pemain', rows: rankedRows(scores, playerLabels) },
  ].filter((section) => section.rows.length > 0)

  if (sections.length === 0) {
    return (
      <p className={clsx('text-center text-sm', dark ? 'text-white/60' : 'text-gray-400')}>
        {emptyText}
      </p>
    )
  }

  // Dark = Helden style (Figma "Kemajuan" rows): #353535 outline, translucent
  // panel, gold rank disc and gold points. Light = the plain session-ended page.
  return (
    <div className="flex w-full flex-col gap-6">
      {sections.map((section) => (
        <section key={section.key} className="flex flex-col gap-3">
          <p
            className={clsx(
              dark
                ? 'text-base font-semibold tracking-[-0.04em] text-[#ccc]'
                : 'text-xs tracking-wide text-gray-500 uppercase'
            )}
          >
            {section.label}
          </p>

          {section.rows.map((row, i) => (
            <div
              key={row.id}
              className={clsx(
                'flex items-center justify-between gap-3 rounded-lg px-4 py-3',
                dark ? 'border border-[#353535] bg-[rgba(8,8,8,0.2)] text-white' : 'border text-sm'
              )}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className={clsx(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                    dark
                      ? i === 0
                        ? 'bg-[#fddb00] text-black'
                        : 'border border-[#fddb00] text-[#ccc]'
                      : 'text-gray-400'
                  )}
                >
                  {i + 1}
                </span>
                <span className="truncate text-base tracking-[-0.04em]">{row.label}</span>
              </span>
              <span
                className={clsx(
                  'shrink-0 tabular-nums',
                  dark ? 'text-lg font-bold text-[#fddb00]' : 'font-mono'
                )}
              >
                {Math.round(row.score)} poin
              </span>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
