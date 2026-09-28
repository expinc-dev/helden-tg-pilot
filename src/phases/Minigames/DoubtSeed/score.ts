import { z } from 'zod'

import type { CorrectnessSignal, MinigameScorerArgs } from '../types'

// The gallery the room looks at after this phase (HLN-003). `enabled: false`
// turns the whole gallery off; `mode: 'optional'` lets a player keep their own
// version private while still submitting it for scoring; `cap` is how many
// versions the host may pin to the central at once.
//
// Every field carries a default and the object itself is defaulted, so a bundle
// authored before this field existed still parses — the CMS writes it from now
// on (templates/doubtSeed.ts), the pilot tolerates its absence (the same
// pattern as TeamSelfie/score.ts).
export const galleryConfigSchema = z.object({
  enabled: z.boolean().default(true),
  mode: z.enum(['auto', 'optional']).default('auto'),
  cap: z.number().int().min(1).max(6).default(3),
})
export type GalleryConfig = z.infer<typeof galleryConfigSchema>

/**
 * Whether a submission starts off the wall.
 *
 * `shared` is a gallery concept, so a gallery that is switched off must not
 * grow a leaf on the answer node for nothing — and a facilitator who turned the
 * wall off has no post-submit control to flip it back. Lives next to the schema
 * (no React, no Firebase) so the writer (lib/session/doubtSeed.ts) and the
 * screens agree by construction instead of by convention.
 */
export function keepsVersionPrivate(gallery: GalleryConfig): boolean {
  return gallery.enabled && gallery.mode === 'optional'
}

// The default literal is annotated, not inferred: `mode: 'auto'` would widen to
// `string` inside a callback, and a widened default silently breaks the
// enum-typed output the renderers switch on.
const GALLERY_CONFIG_DEFAULT: GalleryConfig = { enabled: true, mode: 'auto', cap: 3 }

// Config schema for doubt_seed. Mirrors the CMS's templates/doubtSeed.ts
// intentionally (duplicated, not imported). Split from the renderer so the
// self-check can run without pulling React/Firebase into the import graph.
export const doubtSeedConfigSchema = z.object({
  soulCards: z.array(z.object({ id: z.string(), text: z.string() })).min(1),
  distractorCards: z.array(z.object({ id: z.string(), text: z.string() })).min(1),
  dropZones: z.number().int().min(1).max(10),
  instructions: z.string(),
  gallery: galleryConfigSchema.default((): GalleryConfig => GALLERY_CONFIG_DEFAULT),
})
export type DoubtSeedConfig = z.infer<typeof doubtSeedConfigSchema>

// Doubt-seed is a reflection activity — there is NO single "correct"
// arrangement and NO scoring (the backlog notes `scoring: none`). The scorer
// still returns a shape the scoring layer understands: answered exactly once
// a player has filled the zones, always `correct: false` so no points accrue.
// This matches the "no scoring" intent while keeping the template registered
// under the same CorrectnessSignal contract as every other minigame.
export function scoreDoubtSeed(args: MinigameScorerArgs<DoubtSeedConfig>): CorrectnessSignal {
  const { config, answer } = args
  const answered =
    Array.isArray(answer) && answer.length === config.dropZones && answer.every((c) => c)
  return { correct: false, answered, elapsedMs: 0 }
}
