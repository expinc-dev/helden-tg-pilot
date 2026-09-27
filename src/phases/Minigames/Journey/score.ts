import { z } from 'zod'

// Relative, not `@/…`: the self-check imports this module through a relative
// path and tsx does not resolve the `@` alias (same reason FormToPrompt/score.ts
// reaches for `../../../lib/session/seeds`).
import { answerValue } from '../../../lib/session/seeds'
import {
  formToPromptSeedBindingSchema,
  seedSourceLabel,
  seedSpecsFrom,
} from '../FormToPrompt/score'
import type { CorrectnessSignal } from '../types'

// journey (HLN-014) — the closing recap, "Perjalananmu", on the participant's
// phone.
//
// This phase collects nothing. It is the one screen that hands the day back: the
// seed they wrote at the start, the prompt they built in L4, and the commitment
// they just made, in one scroll. Storyboard: "ringkasan personal — benih + apa
// yang dibuat + komitmen, dalam satu layar". It is READ-ONLY, and the only reason
// it is a template at all is that the three things it reads are runtime data,
// not authored copy.
//
// Two deliberate consequences of "read-only":
//   - The participant's own seat is the only node read
//     (`sessions/{id}/players/{writerId}/answers/{qId}`, one `onlyOnce`
//     listener per qId — the useSeeds/Reflection pattern). Never the room.
//   - The central "Perjalananmu" screen is an authored `content` phase in the
//     CMS, NOT this template: the wall's version is fixed copy the author
//     writes, because it must not show anybody's personal recap. Zero code.
//
// The seed bindings REUSE FormToPrompt's schema and `seedSpecsFrom`, and both
// ids are revisited below. "Which earlier answer becomes a seed card" is
// HLN-002's storage contract, and a second copy of the six-field binding shape
// is exactly how the recap ends up reading a qId the L4 form wrote under a
// different convention — a failure that shows up as a silently empty card.
//
// The schema otherwise mirrors the CMS's templates/journey.ts intentionally
// (duplicated, not imported — the CMS must not depend on this repo).

export const journeyConfigSchema = z.object({
  // The opening line on the phone. Authored: the default is the storyboard's own
  // framing, but a facilitator re-running the event with a different arc needs
  // to be able to reframe it.
  instructions: z.string().default(''),
  // Which earlier answers become seed cards. Same shape and same builder as the
  // L4 form, so a config copied between the two phases resolves identically.
  seedBindings: z.array(formToPromptSeedBindingSchema).default([]),
  // The L4b phase whose answer holds the prompt the participant built. Blank =
  // the recap simply omits that section; an event that runs the closing without
  // L4 is a valid authoring choice, not an error.
  formToPromptPhaseId: z.string().default(''),
  // The Closing "Bagian 1" phase. Normally set: the recap's job is to end on the
  // commitment.
  commitmentPhaseId: z.string().default(''),
  seedsHeading: z.string().default(''),
  promptHeading: z.string().default(''),
  commitmentHeading: z.string().default(''),
  // The line under everything — the note the participant leaves with.
  closingLine: z.string().default(''),
})
export type JourneyConfig = z.infer<typeof journeyConfigSchema>

// The two earlier answers this recap renders, narrowed from their stored shape.

export type JourneyPrompt = {
  pathLabel: string
  prompt: string
}

export type JourneyCommitment = {
  text: string
}

/**
 * The L4b answer, if the participant finished it.
 *
 * Unwraps one `{ value, submittedAt }` level via `answerValue`, exactly like
 * every other reader in this repo, so this works whether the caller hands over
 * the raw snapshot or the already-unwrapped value.
 *
 * Anything unexpected yields undefined: a recap with a missing section is a
 * normal event (someone skipped L4), whereas a throw here would take the last
 * screen of the day down for that participant.
 *
 * A prompt that is present but blank counts as missing — an empty `pre` block
 * reads as a rendering bug, which is worse than an absent section.
 */
export function readJourneyPrompt(raw: unknown): JourneyPrompt | undefined {
  const value = answerValue(raw)
  if (!value || typeof value !== 'object') return undefined
  const { pathLabel, prompt } = value as { pathLabel?: unknown; prompt?: unknown }
  if (typeof prompt !== 'string' || !prompt.trim()) return undefined
  return { pathLabel: typeof pathLabel === 'string' ? pathLabel : '', prompt }
}

/**
 * The commitment answer, if the participant made one.
 *
 * Prefers the stored `sentence` — that is the sentence they watched themselves
 * assemble and then confirmed, and an author editing the sentence template
 * afterwards must not rewrite a commitment already made (see
 * CommitmentAnswerValue). The join is a fallback for an answer written before
 * `sentence` existed, not the normal path.
 */
export function readJourneyCommitment(raw: unknown): JourneyCommitment | undefined {
  const value = answerValue(raw)
  if (!value || typeof value !== 'object') return undefined
  const { action, reason, sentence } = value as {
    action?: unknown
    reason?: unknown
    sentence?: unknown
  }
  if (typeof sentence === 'string' && sentence.trim()) return { text: sentence.trim() }
  if (
    typeof action === 'string' &&
    typeof reason === 'string' &&
    (action.trim() || reason.trim())
  ) {
    return { text: `Saya akan ${action.trim()}, supaya ${reason.trim()}` }
  }
  return undefined
}

// Re-exported so the recorder and the CMS validator build qIds through the ONE
// builder rather than re-deriving the `{phaseId}_{stepId}_{blockIndex}`
// convention a second time.
export { seedSpecsFrom }

// No scoring, and no score is even meaningful here. The recap collects nothing,
// so there is no submission `answered` could ever report; `correct` is always
// false, the same contract doubt_seed uses to stay off every total.
//
// `answered: false` is deliberate rather than "true once the recap loaded":
// when `scoring.mode` is direct, the flush layer persists a PhaseResult per
// player, and a private summary registering as a submission would be a claim
// about the participant that no action of theirs produced.
export function scoreJourney(): CorrectnessSignal {
  return { correct: false, answered: false, elapsedMs: 0 }
}

// ---------------------------------------------------------------------------
// Shipped default — the closing recap's framing, from the storyboard (Content
// CMS Bu Sari/Story.md, "Bagian 2 — Perjalananmu").
//
// The L1 binding is the ONE seed the recap always has a home for: it is the same
// binding the L4 form ships with, and the three ids below are the same authored
// constants (see FormToPrompt/score.ts, where they are annotated — the category
// and the free text live in DIFFERENT steps, and both are block index 1).
// Defaulting to it means an author who only publishes the closing still gets the
// participant's first seed on the recap.
//
// `formToPromptPhaseId` and `commitmentPhaseId` are left BLANK on purpose: both
// name phases that do not exist until the author creates them, and a guessed id
// would silently read a node nobody ever writes — the recap would drop that
// section with no visible cause. An author sets them; until then the recap
// renders whatever is present.
// ---------------------------------------------------------------------------

const L1_PHASE_ID = '01a0c7b0-666f-77b1-9592-b394036528d1'
const L1_TEXT_STEP_ID = '01a0c93e-4dd3-72b1-8d10-89aa24461e33'
const L1_CATEGORY_STEP_ID = '01a0c93c-3b96-7446-998b-29f6310d7928'

export const journeyDefaultConfig: JourneyConfig = {
  instructions: 'Ini yang kamu bawa pulang hari ini.',
  seedBindings: [
    {
      source: 'L1_seed',
      cardLabel: seedSourceLabel('L1_seed'),
      phaseId: L1_PHASE_ID,
      stepId: L1_TEXT_STEP_ID,
      blockIndex: 1,
      categoryStepId: L1_CATEGORY_STEP_ID,
      categoryBlockIndex: 1,
    },
  ],
  formToPromptPhaseId: '',
  commitmentPhaseId: '',
  seedsHeading: 'Yang kamu tulis di awal',
  promptHeading: 'Yang kamu bikin tadi',
  commitmentHeading: 'Yang kamu janjikan ke dirimu',
  closingLine: 'Alatnya boleh sama. Kamu yang bikin beda.',
}
