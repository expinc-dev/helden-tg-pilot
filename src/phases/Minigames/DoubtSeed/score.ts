import { z } from 'zod'

import type { CorrectnessSignal, MinigameScorerArgs } from '../types'

// Config schema for doubt_seed. Mirrors the CMS's templates/doubtSeed.ts
// intentionally (duplicated, not imported). Split from the renderer so the
// self-check can run without pulling React/Firebase into the import graph.
export const doubtSeedConfigSchema = z.object({
  soulCards: z.array(z.object({ id: z.string(), text: z.string() })).min(1),
  distractorCards: z.array(z.object({ id: z.string(), text: z.string() })).min(1),
  dropZones: z.number().int().min(1).max(10),
  instructions: z.string(),
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
