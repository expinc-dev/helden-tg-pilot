// Scale ("attitude") questions in the Quiz phase (HLN-012).
//
// A scale question replaces the option grid with an ordered set of points
// (min..max). It only exists in `on_device` mode: the statement sits on the
// player's own screen, there is no correct answer and there is no reveal — the
// host never scores it, the central screen never shows a distribution.
//
// Deliberately free of Firebase/React/`@/` imports so that
// `checks/phases/quiz/scale.selfcheck.ts` can import it under plain `npx tsx`.
import type { Block } from '@helden-inc/tg-schema'

// Structural, not imported from the phase union: host/central/player and the
// checks script all need exactly this shape.
export type ScaleQuestion = {
  qType: 'scale'
  prompt: Block[]
  min: number
  max: number
  labels?: [string, string]
}

// Type guard — narrows `Question` to ScaleQuestion at every call site.
export function isScaleQuestion(q: { qType: string }): q is ScaleQuestion {
  return q.qType === 'scale'
}

// The ordered points. Anything that is not a usable pair of integers collapses
// to an empty list: the CMS rejects min >= max at publish time, but a
// hand-edited or legacy document must not crash the player.
export function scalePoints(q: ScaleQuestion): number[] {
  const { min, max } = q
  if (!Number.isInteger(min) || !Number.isInteger(max)) return []
  if (max <= min) return []
  // Guard against a pathological range (typo'd 1..1000) rendering forever.
  if (max - min > 20) return []
  const out: number[] = []
  for (let v = min; v <= max; v++) out.push(v)
  return out
}

// Wire shape of a scale answer, as written to players/{id}/answers/{qId}.value
// by the player: the numeric point itself (`scalePoints` domain), while the
// aggregate bucket key is its string form — one distribution bucket per point,
// so `LiveAggregates.distribution` stores the L3 material with no schema change.
export const scaleOptionId = (value: number) => String(value)
