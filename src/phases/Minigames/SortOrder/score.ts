import { z } from 'zod'

import type { CorrectnessSignal, MinigameScorerArgs } from '../types'

// Config schema + pure scorer for sort_order. Split from the renderer so the
// self-check can run without pulling React/Firebase into the import graph.

export const sortOrderItemSchema = z.object({ id: z.string(), label: z.string() })
export type SortOrderItem = z.infer<typeof sortOrderItemSchema>

// One round's item-set diff vs the round before it (BRIGHT-966: multi-round
// sort_order). `add[].label` is not redundant with anything else: a round
// only ever stores its diff, never a repeated full item list, so this is the
// one place a newly-introduced item's label lives. `insertAt` is the position
// in the carried-over order (previous round's submitted answer, minus
// removals) where the new item lands; omitted means "append at the end".
export const sortOrderRoundDiffSchema = z.object({
  remove: z.array(z.string()).default([]),
  add: z
    .array(
      z.object({ id: z.string(), label: z.string(), insertAt: z.number().int().min(0).optional() })
    )
    .default([]),
})
export type SortOrderRoundDiff = z.infer<typeof sortOrderRoundDiffSchema>

// One extra round beyond the base round (round 1 = config.items/correctOrder
// below). rounds[0] is round 2, rounds[1] is round 3, so the array index is
// off by one from the human round number, and off by two from "round 3" -
// worth double-checking any time this is indexed.
export const sortOrderRoundSchema = z.object({
  diff: sortOrderRoundDiffSchema,
  correctOrder: z.array(z.string()).min(2),
  timerSeconds: z.number().int().min(1),
})
export type SortOrderRound = z.infer<typeof sortOrderRoundSchema>

export const sortOrderConfigSchema = z.object({
  items: z.array(sortOrderItemSchema).min(2),
  correctOrder: z.array(z.string()).min(2),
  // Extra rounds beyond round 1 (BRIGHT-966). Empty/omitted parses fine and
  // means "legacy single-round sort_order", unchanged from before this
  // feature existed - no migration needed for already-published configs.
  rounds: z.array(sortOrderRoundSchema).max(2).default([]),
})
export type SortOrderConfig = z.infer<typeof sortOrderConfigSchema>

// Applies one round's diff to the previous round's item list, producing this
// round's item set. Pure list transform: drop removed ids, then splice each
// added item in at its insertAt (clamped to the current length so an
// out-of-range index can't throw), or push at the end when insertAt is
// omitted.
export function applyRoundDiff(
  prevItems: SortOrderItem[],
  diff: SortOrderRoundDiff
): SortOrderItem[] {
  const kept = prevItems.filter((item) => !diff.remove.includes(item.id))
  const result = [...kept]
  for (const item of diff.add) {
    const at = item.insertAt !== undefined ? Math.min(item.insertAt, result.length) : result.length
    result.splice(at, 0, { id: item.id, label: item.label })
  }
  return result
}

// Cumulative item sets for every round in `config`: [round1, round2, round3,
// ...], one entry per round including the base. Folds applyRoundDiff over
// config.rounds starting from config.items. Length is always
// config.rounds.length + 1 (round 1 always exists). Used by the CMS round
// editor (to know what items a round's correctOrder ranks over) and by the
// pilot's round-state logic (to compute the carried-over starting order) -
// neither is wired up yet, this is schema-only groundwork (BRIGHT-966).
export function roundItemSets(config: SortOrderConfig): SortOrderItem[][] {
  const sets: SortOrderItem[][] = [config.items]
  for (const round of config.rounds) {
    sets.push(applyRoundDiff(sets[sets.length - 1], round.diff))
  }
  return sets
}

// Exact-match correctness on the ordered id list. Partial credit not modelled
// in v1 (blueprint §9 says "correctness + speed", not N-of-M). Clock skew on
// answerSubmittedAt is clamped to 0 so a stale device can't earn negative time.
export function scoreSortOrder(args: MinigameScorerArgs<SortOrderConfig>): CorrectnessSignal {
  const { config, answer, answerSubmittedAt, phaseStartMs } = args
  if (!Array.isArray(answer)) return { correct: false, answered: false, elapsedMs: 0 }
  const ids = answer.filter((v) => typeof v === 'string') as string[]
  const answered = ids.length === config.items.length
  const correct =
    answered &&
    ids.length === config.correctOrder.length &&
    ids.every((id, i) => id === config.correctOrder[i])
  const elapsedMs =
    answerSubmittedAt && answerSubmittedAt > phaseStartMs ? answerSubmittedAt - phaseStartMs : 0
  return { correct, answered, elapsedMs }
}
