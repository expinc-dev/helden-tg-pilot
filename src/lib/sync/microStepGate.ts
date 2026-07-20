import type { MicroStep } from '@helden-inc/tg-schema'

// Pure gating rule: a step blocks "Next" only when its author opted in via
// gate.requireAnswered AND the step actually carries a question block —
// requireAnswered on a step with no question would deadlock the player, so
// that combination is treated as "not gated" rather than trusted blindly.
export function stepRequiresAnswer(step: MicroStep): boolean {
  return !!step.gate?.requireAnswered && step.blocks.some((b) => b.kind === 'question')
}
