import type { Block, MicroStep, Phase, PublishedGame, Question } from '@helden-inc/tg-schema'

import { demoBundle } from './demoBundle'

// Player-safe view of demoBundle — same stripping tg-cms's publish pipeline
// applies before download (helden-tg-cms/src/pages/Game/projection.ts). Only
// pages/player/play/index.tsx should import this; host/central keep reading
// demoBundle directly (grading happens on their side — see
// lib/session/quizScoring.ts and phases/codecheck.ts). Once CMS publish is
// wired to Firestore, this whole file goes away with demoBundle itself.
//
// Not covered: 'order' / 'image_sequence' questions, whose correct answer IS
// the authored item order, not a separate key field.
function stripQuestion(q: Question): Question {
  const prompt = stripBlocks(q.prompt)
  switch (q.qType) {
    case 'single_choice':
      return { ...q, prompt, correctId: undefined }
    case 'multi_choice':
      return { ...q, prompt, correctIds: undefined }
    case 'short_answer':
      return { ...q, prompt, acceptedAnswers: undefined }
    default:
      return { ...q, prompt }
  }
}

function stripBlock(b: Block): Block {
  return b.kind === 'question' ? { ...b, question: stripQuestion(b.question) } : b
}

function stripBlocks(blocks: Block[]): Block[] {
  return blocks.map(stripBlock)
}

function stripMicroStep(step: MicroStep): MicroStep {
  return {
    ...step,
    blocks: stripBlocks(step.blocks),
    subSteps: step.subSteps?.map(stripMicroStep),
  }
}

function stripPhase(phase: Phase): Phase {
  const content = phase.content
  switch (content.type) {
    case 'quiz':
      return {
        ...phase,
        content: { ...content, questions: content.questions.map(stripQuestion) },
      }
    case 'microlearning':
      return { ...phase, content: { ...content, steps: content.steps.map(stripMicroStep) } }
    case 'content':
      return { ...phase, content: { ...content, blocks: stripBlocks(content.blocks) } }
    case 'presentation':
      return {
        ...phase,
        content: {
          ...content,
          slides: content.slides.map((slide) => ({ ...slide, blocks: stripBlocks(slide.blocks) })),
        },
      }
    case 'codeinput':
      // Empty string, not omitted — schema requires `expected: string`. The
      // real check runs off the host-seeded RTDB secret, never this field.
      return { ...phase, content: { ...content, expected: '' } }
    default:
      return phase
  }
}

function toPlayerSafeGame(game: PublishedGame): PublishedGame {
  const phases = Object.fromEntries(
    Object.entries(game.phases).map(([id, phase]) => [id, stripPhase(phase)])
  )
  return { ...game, phases }
}

export const demoBundlePlayerSafe: PublishedGame = toPlayerSafeGame(demoBundle)
