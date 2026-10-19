// Pure "level select" grouping for a mid-game idle phase in a SEQUENTIAL bundle.
// The schema has no level/group field: levels only share a title prefix
// ("Level 2A: …", "L2-1 Video …", "1a — Video …", "Closing 2 — …"), the same
// convention Quiz/bundleGroup.ts already relies on. No Firebase/React: runnable
// under tsx via checks/phases/idle/levels.selfcheck.ts.

export type PhaseLike = { id: string; type: string; title?: string }

// Progressive, as the Figma subtitle says ("Selesaikan semua secara berurutan"):
// finished levels are done, the first unfinished one is the only tappable card,
// everything after it is locked.
export type LevelStatus = 'done' | 'available' | 'locked'

export type LevelGroup = {
  // First phase of the level — where the host's pick jumps to.
  id: string
  // "Level 2", "Closing" — what the card shows.
  label: string
  phaseIds: string[]
  titles: string[]
  playedCount: number
  // Every phase of the level has been played (sessions/{id}/played/*).
  played: boolean
  status: LevelStatus
}

// "Level 2A: …" / "Level 2: …" → 2, "L3-0 Video …" → 3, "1a — Video …" → 1. A
// letter right after the digit after a bare "L" ("L2A") is not this convention,
// so it is left alone.
const LEVEL_RE = /^(?:Level\s*(\d+)|L(\d+)(?![A-Za-z])|(\d+)[A-Za-z]?\s+[—–-])/i
const CLOSING_RE = /^Closing\b/i

function levelKey(title: string | undefined): { key: string; label: string } | null {
  if (!title) return null
  const m = LEVEL_RE.exec(title)
  if (m) {
    const n = m[1] ?? m[2] ?? m[3]
    return { key: n, label: `Level ${n}` }
  }
  if (CLOSING_RE.test(title)) return { key: 'closing', label: 'Closing' }
  return null
}

// Levels in phaseOrder, optionally only those AFTER `afterPhaseId`. A phase
// whose title carries no level prefix joins the level before it (so an untitled
// follow-up never becomes a card of its own); with nothing before it, it stands
// alone under its own title. idle (other select screens) and end are not levels.
export function groupLevels(
  phaseOrder: readonly string[],
  phases: Record<string, PhaseLike | undefined>,
  afterPhaseId: string | undefined,
  played: Record<string, true>
): LevelGroup[] {
  const from = afterPhaseId === undefined ? -1 : phaseOrder.indexOf(afterPhaseId)
  if (afterPhaseId !== undefined && from < 0) return []

  const raw: { key: string; label: string; members: PhaseLike[] }[] = []
  for (let i = from + 1; i < phaseOrder.length; i++) {
    const p = phases[phaseOrder[i]]
    if (!p || p.type === 'idle' || p.type === 'end') continue
    const k = levelKey(p.title)
    const last = raw[raw.length - 1]
    if (last && (!k || k.key === last.key)) {
      last.members.push(p)
    } else {
      raw.push({ key: k?.key ?? p.id, label: k?.label ?? p.title ?? p.id, members: [p] })
    }
  }

  const base = raw.map((g) => {
    const playedCount = g.members.filter((p) => played[p.id]).length
    return { g, playedCount, done: playedCount === g.members.length }
  })
  const firstOpen = base.findIndex((b) => !b.done)

  return base.map(({ g, playedCount, done }, i) => ({
    id: g.members[0].id,
    label: g.label,
    phaseIds: g.members.map((p) => p.id),
    titles: g.members.map((p) => p.title ?? p.id),
    playedCount,
    played: done,
    status: done ? 'done' : i === firstOpen ? 'available' : 'locked',
  }))
}

// An idle phase is the Select Level screen only when it sits mid-game in a
// sequential bundle: the FIRST phase being idle is the old "waiting room" idle,
// and an idle with no level in the bundle has nothing to pick, so both stay
// as-is (callers fall back to the roster idle screen on an empty list). Lists
// EVERY level of the game, not only those after the idle, so finished levels
// show as done.
export function levelSelectGroups(
  phaseOrder: readonly string[],
  phases: Record<string, PhaseLike | undefined>,
  idlePhaseId: string,
  played: Record<string, true>
): LevelGroup[] {
  if (phaseOrder.indexOf(idlePhaseId) <= 0) return []
  return groupLevels(phaseOrder, phases, undefined, played)
}

// Share of all level phases already played, 0–100.
export function levelProgressPct(groups: readonly LevelGroup[]): number {
  const total = groups.reduce((n, g) => n + g.phaseIds.length, 0)
  if (total === 0) return 0
  const done = groups.reduce((n, g) => n + g.playedCount, 0)
  return Math.round((done / total) * 100)
}
