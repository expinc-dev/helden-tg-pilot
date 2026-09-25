import type { Block, PublishedGame } from '@helden-inc/tg-schema'

// The two things a participant wrote earlier, brought back for L4 (HLN-002).
//
// L1 "1e — Plant the Seed" contributes a category (single_choice) plus free
// text; L2's reflection contributes free text only. Both already live in the
// ONE node a player is allowed to read about themselves:
//
//   sessions/{sessionId}/players/{playerId}/answers/{qId}
//
// written by submitAnswer at submit time. No new writer, no new RTDB node, no
// rules change: `sessions/$sid/players` is `.read: "auth != null"`, so a later
// phase reading an earlier phase's qId is already permitted.
//
// Cross-level only works because L1/L2/L4 are phases of ONE event (see
// backlog/ARCHITECTURE.md §1): sessionId, playerId and EVENT_ID stay constant
// for the whole run. This runtime has no cross-event participant identity —
// per level we would get a different sessionId, a different playerId and a
// different `events/{EVENT_ID}` subtree.
//
// Durable results are NOT usable here: flushPhaseResults()
// (lib/session/flush.ts) writes sessions/{id}/results/{playerId}/phaseResults/
// {phaseId} only when the host leaves the phase, so the node does not exist
// while L4 is running. It is the right store for a post-session recap, not for
// a live phase.
//
// Pure by design — no Firebase, no React — so the qId convention below is
// checkable without a network: checks/lib/session/seeds.selfcheck.ts.
//
// Deliberately NOT here: where a seed gets *rendered*. The `4a`/`4b`/Closing
// surfaces do not exist in this repo yet, and how a seed reaches an authored
// form field is HLN-005's `FormToPromptConfig` — not this module's shape.

export type SeedSource = 'L1_seed' | 'L2_reflection'

export type Seed = {
  source: SeedSource
  text: string
  category?: string
}

// What to read and where. `qId` is the exact RTDB answer key. `categoryQId` is
// optional and only L1 has one — the single_choice block that precedes the
// open_text one (a different step, see microSeedSpec below).
//
// Passed in rather than hardcoded: the L1 phase/step ids are authored content,
// so they belong to whoever authors the L4 phase (HLN-005's "authorable in
// MinigameEditor or Phase config — not hardcoded"). The two builders below
// exist so a caller cannot get the qId format wrong.
export type SeedSpec = {
  source: SeedSource
  qId: string
  categoryQId?: string
}

// microlearning's qId rule, verbatim from
// phases/Microlearning/PlayerPane/index.tsx: `${phase.id}_${current.id}_${i}`.
export function microQId(phaseId: string, stepId: string, blockIndex: number): string {
  return `${phaseId}_${stepId}_${blockIndex}`
}

// A microlearning seed spec. `seedStepId`/`seedBlockIndex` locate the open_text
// question block; `categoryStepId`/`categoryBlockIndex` the single_choice one.
//
// The two are named separately because L1 1e puts them in DIFFERENT steps (the
// category is step 1, the free text step 2) — a single `stepId` parameter would
// silently build the wrong key for the shipped bundle, and the failure mode is
// a participant seeing no seed at all rather than an error.
export function microSeedSpec(opts: {
  phaseId: string
  seedStepId: string
  seedBlockIndex: number
  source: SeedSource
  categoryStepId?: string
  categoryBlockIndex?: number
}): SeedSpec {
  const { phaseId, seedStepId, seedBlockIndex, source, categoryStepId, categoryBlockIndex } = opts
  return {
    source,
    qId: microQId(phaseId, seedStepId, seedBlockIndex),
    ...(categoryStepId === undefined || categoryBlockIndex === undefined
      ? {}
      : { categoryQId: microQId(phaseId, categoryStepId, categoryBlockIndex) }),
  }
}

// reflection's qId rule: the phase id itself, no prefix
// (phases/Reflection/lib.ts + Reflection/player/index.tsx).
export function reflectionQId(phaseId: string): string {
  return phaseId
}

export function reflectionSeedSpec(phaseId: string, source: SeedSource): SeedSpec {
  return { source, qId: reflectionQId(phaseId) }
}

// Answers are stored as `{ value, submittedAt }` (submitAnswer), but a caller
// that already applied `.value` (every other reader in this repo does) must not
// be punished for it. Unwrap one level when that is what we were handed.
export function answerValue(raw: unknown): unknown {
  if (raw && typeof raw === 'object' && 'value' in raw) {
    return (raw as { value: unknown }).value
  }
  return raw
}

// The text a seed is made of, from either answer shape:
//   microlearning open_text → string
//   reflection              → { text, scale }
// Whitespace-only counts as unanswered: a player who typed a space has not
// planted a seed, and the surfaces must fall back to the italic example
// rather than show an empty card (HLN-005).
export function readSeedText(raw: unknown): string | undefined {
  const v = answerValue(raw)
  if (typeof v === 'string') return v.trim() || undefined
  if (v && typeof v === 'object') {
    const text = (v as { text?: unknown }).text
    if (typeof text === 'string') return text.trim() || undefined
  }
  return undefined
}

// qId → { phaseId, stepId, blockIndex }. Authored ids are UUIDs (no underscore)
// so splitting on the LAST underscore is unambiguous; anything that does not
// tail a block index degrades to undefined instead of throwing, because a
// bundle drift must never take a phone screen down.
export function parseMicroQId(
  qId: string
): { phaseId: string; stepId: string; blockIndex: number } | undefined {
  const last = qId.lastIndexOf('_')
  if (last <= 0) return undefined
  const mid = qId.lastIndexOf('_', last - 1)
  if (mid <= 0) return undefined
  const blockIndex = Number(qId.slice(last + 1))
  if (!Number.isInteger(blockIndex) || blockIndex < 0) return undefined
  return { phaseId: qId.slice(0, mid), stepId: qId.slice(mid + 1, last), blockIndex }
}

// The human label of the option a single_choice answer points at — the stored
// `value` is the option UUID, never its text (QuestionView → onDraftChange).
// Returns undefined for anything unresolvable (unknown id, non-choice block,
// another phase type, bundle unavailable) so the category is simply absent and
// the seed still renders.
export function choiceLabel(
  bundle: PublishedGame | undefined,
  qId: string,
  optionId: unknown
): string | undefined {
  if (!bundle) return undefined
  if (typeof optionId !== 'string' || !optionId) return undefined
  const parsed = parseMicroQId(qId)
  if (!parsed) return undefined
  const content = bundle.phases[parsed.phaseId]?.content
  if (!content || content.type !== 'microlearning') return undefined
  const step = content.steps.find((s) => s.id === parsed.stepId)
  const block: Block | undefined = step?.blocks[parsed.blockIndex]
  if (!block || block.kind !== 'question') return undefined
  const q = block.question
  if (q.qType !== 'single_choice' && q.qType !== 'multi_choice') return undefined
  return q.options.find((o) => o.id === optionId)?.label
}

// Raw per-qId answers → the seed list the L4 surfaces render, in spec order.
// Specs whose answer is missing or blank are dropped entirely — "never block
// L4 if seeds empty" (graceful degrade to the empty form is HLN-005's job).
export function buildSeeds(
  bundle: PublishedGame | undefined,
  answers: Record<string, unknown>,
  specs: SeedSpec[]
): Seed[] {
  const seeds: Seed[] = []
  for (const spec of specs) {
    const text = readSeedText(answers[spec.qId])
    if (!text) continue
    const category =
      spec.categoryQId === undefined
        ? undefined
        : choiceLabel(bundle, spec.categoryQId, answerValue(answers[spec.categoryQId]))
    seeds.push(category ? { source: spec.source, text, category } : { source: spec.source, text })
  }
  return seeds
}

// Every RTDB key a spec set needs a listener on, deduped and stable — the hook
// subscribes to this so a caller passing a fresh array literal each render does
// not re-subscribe.
export function seedQIds(specs: SeedSpec[]): string[] {
  const out: string[] = []
  for (const spec of specs) {
    if (!out.includes(spec.qId)) out.push(spec.qId)
    if (spec.categoryQId && !out.includes(spec.categoryQId)) out.push(spec.categoryQId)
  }
  return out
}

// One RTDB snapshot folded into the collected answer map. Split out of the hook
// so the two rules that matter are checkable without a browser:
//   1. `{ value, submittedAt }` is unwrapped here, once — the same unwrap every
//      reader in this repo does, so buildSeeds receives what it expects.
//   2. A node the player never wrote (null/undefined) leaves the map ALONE
//      rather than storing an explicit undefined. A seed whose answer arrives
//      later must not blank out a seed that already resolved, and a listener
//      that fires again with the same value must not churn the map identity and
//      re-render every consumer of useSeeds.
// The map identity is preserved on a no-op so React can skip the re-render.
export function mergeSeedAnswer(
  prev: Record<string, unknown>,
  qId: string,
  raw: unknown
): Record<string, unknown> {
  const value = answerValue(raw)
  if (value === undefined || value === null) return prev
  if (Object.is(prev[qId], value)) return prev
  return { ...prev, [qId]: value }
}
