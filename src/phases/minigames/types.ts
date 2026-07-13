import type { Phase } from '@helden-inc/tg-schema'
import type { z } from 'zod'

import type { TeamRole } from '@/lib/sync/useTeamRole'

import type { Role } from '../PhaseRouter'

// Registry contract (BLUEPRINT_runtime §9). A template is code + a Zod schema
// for its config + a pure scorer. Unknown templateId → safe fallback.
//
// The scorer returns the SAME CorrectnessSignal used elsewhere in the runtime
// (session/flush.ts::resolveCorrectness) — templates only decide "did the
// player get it right and when", scorePhase() in @/lib/scoring/score.ts still does
// the maxPoints/speedBonus math. So `phase.scoring` from the CMS keeps working
// uniformly across templates.

export interface CorrectnessSignal {
  correct: boolean
  answered: boolean
  elapsedMs: number
}

export interface MinigameScorerArgs<TConfig> {
  config: TConfig
  answer: unknown // raw value from players/{id}/answers/{phaseId}.value
  answerSubmittedAt?: number // RTDB serverTimestamp resolves to a number
  phaseStartMs: number
}

export interface MinigameRendererProps<TConfig> {
  config: TConfig
  phase: Phase
  sessionId: string
  playerId?: string
  role: Role
  teamRole: TeamRole // 'solo' | 'leader' | 'member' — resolved by PhaseRouter
}

export interface MinigameTemplate<TConfig> {
  templateId: string
  configSchema: z.ZodType<TConfig>
  Renderer: React.FC<MinigameRendererProps<TConfig>>
  scorer: (args: MinigameScorerArgs<TConfig>) => CorrectnessSignal | null
}
