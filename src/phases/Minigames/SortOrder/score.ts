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
//
// triggerCode (BRIGHT-967): the plaintext code printed on THIS round's
// physical QR card (round 2's rounds[0].triggerCode is scanned to advance
// FROM round 1 INTO round 2, etc). Host-seeded into
// sessions/{id}/secrets/{phaseId}/round{N} at phase-open (normalized the
// same way codeinput's `expected` is - see control.ts and
// database.rules.json) and never sent to a player's client as plaintext;
// the player's own scan is normalized identically and compared server-side
// by the RTDB rule, this device never learns whether it guessed right except
// by whether the write succeeded. caseSensitive mirrors codeinput's field of
// the same name and default.
export const sortOrderRoundSchema = z.object({
  diff: sortOrderRoundDiffSchema,
  correctOrder: z.array(z.string()).min(2),
  timerSeconds: z.number().int().min(1),
  triggerCode: z.string().min(1),
  caseSensitive: z.boolean().default(false),
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

// Effective item set + correctOrder for one 1-indexed round of `config`
// (BRIGHT-966). Round 1 is the base (config.items/correctOrder); round N>=2
// comes from config.rounds[N-2] (see the off-by-two note on
// sortOrderRoundSchema) for correctOrder, combined with roundItemSets(config)
// for the item set (carries labels for added items like E, which config.items
// alone never has). Falls back to round 1 if `round` is out of range - should
// not happen since roundState never advances past config.rounds.length + 1,
// but a display fallback is cheaper than a crash if it ever does.
export function roundContentFor(
  config: SortOrderConfig,
  round: number
): { items: SortOrderItem[]; correctOrder: string[] } {
  const extra = round >= 2 ? config.rounds[round - 2] : undefined
  if (!extra) return { items: config.items, correctOrder: config.correctOrder }
  const sets = roundItemSets(config)
  return { items: sets[round - 1] ?? config.items, correctOrder: extra.correctOrder }
}

// Applies a round's diff to a previously-submitted ANSWER order (bare ids,
// no labels) rather than an authored item list - used at round-advance time
// to seed the next round's starting drag order from the player's own
// previous submission (BRIGHT-966 AC: "starts from previous result"). Same
// remove/add (insertAt) semantics as applyRoundDiff above, just operating on
// ids since a submitted answer never carries labels; kept as a separate
// function rather than reusing applyRoundDiff with placeholder labels, so
// neither reads as more general than it actually is.
export function applyRoundDiffToOrder(prevOrder: string[], diff: SortOrderRoundDiff): string[] {
  const kept = prevOrder.filter((id) => !diff.remove.includes(id))
  const result = [...kept]
  for (const item of diff.add) {
    const at = item.insertAt !== undefined ? Math.min(item.insertAt, result.length) : result.length
    result.splice(at, 0, item.id)
  }
  return result
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
