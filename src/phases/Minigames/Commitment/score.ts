import { z } from 'zod'

import type { CorrectnessSignal, MinigameScorerArgs } from '../types'

// commitment (HLN-014) — Closing "Bagian 1", the last thing a participant
// writes before going home.
//
// Why a template and not `reflection`'s open_text (HLN-014's Option A): the
// shape IS the pedagogy. The storyboard's design note is explicit — "Format
// 'Saya akan __, supaya __' memaksa tindakan spesifik + alasan yang menautkan
// ke pelajaran. 'Senin depan' bikin nyata." One free-text box with the pattern
// tucked into its placeholder lets the participant submit the action and skip
// the reason, and the reason is the half that ties next week's step back to
// today's lesson. Two labelled fields plus the live assembled sentence make the
// shape impossible to miss — that live line is the whole reason this is not a
// reflection phase.
//
// Config-only, like every other template: the copy and the sentence pattern
// live in `minigame.config` — the one part of `phase.content` that survives
// publishing (`publishedGameSchema` is all `z.core.$strip`) — so the closing
// wording can be revised after a real run without touching the pilot.
//
// The schema mirrors the CMS's templates/commitment.ts intentionally
// (duplicated, not imported — the CMS must not depend on this repo). Defaults
// must agree between the two copies, otherwise a config saved in the CMS could
// be rejected here.
//
// Split from the renderer so the self-check can run without React/Firebase.

export const commitmentConfigSchema = z.object({
  // The storyboard's participant-facing block, verbatim: the framing, the
  // required shape, and the worked example. One field rather than three because
  // it is read as one paragraph on the phone, and a `contoh:` line separated
  // from the instruction it illustrates is the classic way an author deletes
  // one and leaves the other.
  instructions: z.string().default(''),
  // Above the two boxes. The accent line already reads "Saya akan", so the
  // labels continue that sentence rather than name a data field.
  actionLabel: z.string().default(''),
  reasonLabel: z.string().default(''),
  actionPlaceholder: z.string().default(''),
  reasonPlaceholder: z.string().default(''),
  // The assembled commitment. `{{action}}` / `{{reason}}` are the only two
  // placeholders the runtime understands; an author who renames them gets the
  // literal `{{action}}` on screen plus a console warning (see
  // assembleCommitment) instead of a silently truncated sentence.
  sentenceTemplate: z.string().default('Saya akan {{action}}, supaya {{reason}}'),
  // Shown after submit, under the stored sentence.
  doneCopy: z.string().default(''),
})
export type CommitmentConfig = z.infer<typeof commitmentConfigSchema>

// What a submitted commitment leaves behind.
//
// `sentence` is stored rather than recomputed from `action`/`reason`: it is the
// exact sentence the participant watched themselves assemble and then confirmed,
// and an author editing `sentenceTemplate` afterwards must not rewrite a
// commitment that has already been made. Same reasoning as
// FormToPromptAnswerValue.prompt.
export type CommitmentAnswerValue = {
  action: string
  reason: string
  sentence: string
}

// Placeholder syntax `{{key}}`, tolerant of inner spaces — identical to
// form_to_prompt's, because an author who has written one template's copy will
// type the other's the same way.
const PLACEHOLDER = /\{\{\s*([^{}]*?)\s*\}\}/g

// What an unfilled slot shows while the participant is still typing. Deliberately
// NOT form_to_prompt's `[kosong]`: that marker labels a slot in a prompt the
// participant is about to paste somewhere, whereas this line is a live mirror of
// a sentence being written, and an ellipsis reads as "not finished yet" instead
// of "you did something wrong".
export const COMMITMENT_EMPTY_SLOT = '…'

/**
 * Splice the two halves into the authored sentence pattern.
 *
 * Unknown placeholders are left exactly as written (plus a console warning)
 * rather than blanked: an author named something this template does not collect,
 * and `{{foo}}` on screen is a bug report, whereas an empty string is a silently
 * wrong commitment.
 */
export function assembleCommitment(template: string, action: string, reason: string): string {
  const values: Record<string, string> = { action: action.trim(), reason: reason.trim() }
  return template.replace(PLACEHOLDER, (match, rawName: string) => {
    const key = rawName.trim()
    if (!(key in values)) {
      console.warn(`[commitment] unknown placeholder "${match}" in sentence template`)
      return match
    }
    return values[key] || COMMITMENT_EMPTY_SLOT
  })
}

/**
 * Which half is still blank.
 *
 * Both are required — the shape has no meaning with one half missing — so the
 * submit button is gated on this being empty. Unlike form_to_prompt there is no
 * "send it half-done" variant to support: a prompt with `[kosong]` in it can
 * still be useful to a participant experimenting with a chatbot, but a
 * commitment with `… supaya …` in it is not a commitment.
 */
export function missingCommitmentKeys(action: string, reason: string): string[] {
  const missing: string[] = []
  if (!action.trim()) missing.push('action')
  if (!reason.trim()) missing.push('reason')
  return missing
}

// No scores. The closing is taken home, not ranked against the room, and the
// storyboard's own table gives it no scoring of any kind. `answered` is the only
// signal the scoring layer can use; `correct` is always false so this phase
// cannot add points to anyone's total (same contract as doubt_seed).
//
// Reading a persisted answer means tolerating an older/partial shape, hence the
// narrowing rather than a cast.
export function scoreCommitment(args: MinigameScorerArgs<CommitmentConfig>): CorrectnessSignal {
  const { answer } = args
  if (!answer || typeof answer !== 'object') {
    return { correct: false, answered: false, elapsedMs: 0 }
  }
  const { action, reason } = answer as { action?: unknown; reason?: unknown }
  const answered =
    typeof action === 'string' &&
    typeof reason === 'string' &&
    missingCommitmentKeys(action, reason).length === 0
  return { correct: false, answered, elapsedMs: 0 }
}

// ---------------------------------------------------------------------------
// Shipped default — the Closing's "Bagian 1" copy, verbatim from the storyboard
// (Content CMS Bu Sari/Story.md, "KONTEN (DI HP)"). Indonesian, as spoken to the
// participant; the CMS stores it as editable authorable copy either way.
// ---------------------------------------------------------------------------

export const commitmentDefaultConfig: CommitmentConfig = {
  instructions:
    'Satu langkah. Senin depan. Kamu sudah coba hari ini. Sekarang, satu hal konkret yang mau kamu lakukan untuk usahamu minggu depan — pakai yang kamu pelajari hari ini.\n\nTulis dalam bentuk: “Saya akan ___, supaya ___.”\n\nContoh: “Saya akan perbaiki tulisan promo produk andalan saya pakai cara tadi, supaya terdengar lebih seperti saya — bukan seperti toko lain.”',
  actionLabel: 'Saya akan…',
  reasonLabel: '…supaya…',
  // Bland and format-only on purpose: the worked example is already in the
  // instructions above, and repeating it inside the box is how it gets copied
  // verbatim instead of answered.
  actionPlaceholder: 'satu langkah konkret untuk minggu depan',
  reasonPlaceholder: 'kenapa itu penting buat usahamu',
  sentenceTemplate: 'Saya akan {{action}}, supaya {{reason}}',
  doneCopy: 'Ini milikmu — bawa pulang. Buka lagi Senin depan.',
}
