import type { Phase, ScoringConfig } from '@helden-inc/tg-schema'

// Pure scoring functions (BLUEPRINT_runtime §8). Additive: per-answer contribution.
// No side effects, no Firebase, no teamMode branching — attribution (playerId vs
// teamId) is a caller concern, this file only computes the number.

export interface ScoreContext {
  correct: boolean // did the answer match the key
  answered: boolean // did the player submit anything at all
  elapsedMs: number // time from phase-open to submit (0 if untimed)
  phaseDurationMs: number // total phase timer window (0 if untimed)
}

export function scoreCorrectness(cfg: ScoringConfig, ctx: ScoreContext): number {
  return ctx.correct ? (cfg.maxPoints ?? 0) : 0
}

// Linear decay from maxBonus at t=0 to 0 at decaySeconds; clamped to [0, maxBonus].
// A wrong answer never earns a speed bonus.
export function scoreSpeed(cfg: ScoringConfig, ctx: ScoreContext): number {
  if (!ctx.correct || !cfg.speedBonus) return 0
  const { maxBonus, decaySeconds } = cfg.speedBonus
  if (decaySeconds <= 0) return 0
  const elapsedSec = ctx.elapsedMs / 1000
  const bonus = maxBonus * (1 - elapsedSec / decaySeconds)
  return Math.max(0, Math.min(maxBonus, bonus))
}

export function scoreParticipation(cfg: ScoringConfig, ctx: ScoreContext): number {
  return ctx.answered ? (cfg.maxPoints ?? 0) : 0
}

// Dispatcher: routes by config.mode. Unknown/none → 0. correctness_and_speed
// composes the two (correctness base + optional speed bonus on top).
export function scoreAnswer(cfg: ScoringConfig | undefined, ctx: ScoreContext): number {
  if (!cfg) return 0
  switch (cfg.mode) {
    case 'correctness':
      return scoreCorrectness(cfg, ctx)
    case 'speed':
      return scoreSpeed(cfg, ctx)
    case 'correctness_and_speed':
      return scoreCorrectness(cfg, ctx) + scoreSpeed(cfg, ctx)
    case 'participation':
      return scoreParticipation(cfg, ctx)
    case 'none':
    default:
      return 0
  }
}

// Convenience wrapper for the flush site: pull ScoringConfig off a Phase.
export function scorePhase(phase: Phase, ctx: ScoreContext): number {
  return scoreAnswer(phase.scoring, ctx)
}
