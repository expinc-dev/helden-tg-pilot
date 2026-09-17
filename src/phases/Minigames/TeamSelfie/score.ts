import { z } from 'zod'

import type { CorrectnessSignal, MinigameScorerArgs } from '../types'

// Config schema + pure scorer for team_selfie (HLN-018). Split from the
// renderer so the self-check can run without pulling React/Firebase into the
// import graph. Mirrors the CMS's templates/teamSelfie.ts intentionally
// (duplicated, not imported — tg-schema's MiniGameContent.config is
// deliberately loose, which also means adding this template needs no schema
// publish).
//
// `caption` / `maxImagePx` / `jpegQuality` carry defaults so a CMS bundle
// authored before those fields existed still parses (same tolerance the
// analyze_grid reader has for older answer shapes).
export const teamSelfieConfigSchema = z.object({
  /** Hero line overlaid on the central gallery. Author-supplied, no names. */
  finalLine: z.string(),
  /** Optional smaller line under the hero. Omitted → nothing rendered. */
  caption: z.string().optional(),
  /** When false the first saved photo is locked and cannot be replaced. */
  retakeAllowed: z.boolean().default(true),
  /** Longest edge of the stored JPEG, in px. Keeps the RTDB write under cap. */
  maxImagePx: z.number().int().min(160).max(2048).default(800),
  /** JPEG quality, 0–1. */
  jpegQuality: z.number().min(0.1).max(1).default(0.6),
})
export type TeamSelfieConfig = z.infer<typeof teamSelfieConfigSchema>

/**
 * The RTDB node every renderer agrees on for "this team's photo".
 * `selfies/{keyId}` — the key is the team id in team mode, the player id
 * otherwise, which is exactly what the `selfies` rules in database.rules.json
 * authorise (team leader via teams/{teamId}/ownerPlayerId, or the player
 * themselves for a solo session).
 */
export const selfieKeyId = (teamId: string | undefined, playerId: string | undefined) =>
  teamId ?? playerId ?? ''

export interface SelfieEntry {
  image?: string
  caption?: string
  createdAt?: number
  updatedBy?: string
}

/**
 * What the player writes to the STANDARD answers path so the scorer can run.
 * Deliberately a small marker, not the photo: the image already lives in
 * `selfies/{keyId}`, and `flush.ts` reads `players/{id}/answers/{phaseId}` —
 * duplicating a ~100 KB data URL into that node would double the session's
 * payload for no gain. `hasPhoto` is the only thing the scorer needs.
 */
export interface SelfieAnswerMarker {
  hasPhoto?: boolean
  keyId?: string
}

function hasSelfiePhoto(answer: unknown): boolean {
  if (typeof answer === 'string') return answer.startsWith('data:image/')
  if (answer && typeof answer === 'object') {
    const o = answer as Record<string, unknown>
    if (o.hasPhoto === true) return true
    return typeof o.image === 'string' && o.image.startsWith('data:image/')
  }
  return false
}

/**
 * A closing selfie is a participation activity — there is no wrong photo. So
 * `correct` tracks "a photo was actually submitted", the same way
 * `reflection` is scored. That keeps the template honest under both `correctness`
 * and `participation` scoring modes: an author who leaves scoring at `none`
 * still sees the gallery, and one who sets a participation bonus gets it.
 *
 * Tolerant by design: the marker shape, a bare data URL, and the fuller
 * `{ image }` envelope all count. Only the last two are reachable today; the
 * envelope is kept so a future change of the answers payload cannot silently
 * zero every score.
 */
export function scoreTeamSelfie(args: MinigameScorerArgs<TeamSelfieConfig>): CorrectnessSignal {
  const { answer, answerSubmittedAt, phaseStartMs } = args
  const hasPhoto = hasSelfiePhoto(answer)
  const elapsedMs =
    answerSubmittedAt && answerSubmittedAt > phaseStartMs ? answerSubmittedAt - phaseStartMs : 0
  return { correct: hasPhoto, answered: hasPhoto, elapsedMs }
}
