import type { Phase } from '@helden-inc/tg-schema'

import { StepBody } from '@/phases/Microlearning/PlayerPane/StepBody'

import type { Role } from '../PhaseRouter'

type ContentPageContent = Extract<Phase['content'], { type: 'content' }>

// The authored content page: a scrolling column of reading blocks. Every role
// sees the same page — the schema has no per-device variant and there is no
// host-paced reveal, so unlike End/Presentation there is nothing to branch on.
//
// Reuses StepBody exactly as Presentation does: it already owns the whole
// Block[] flow (hero image handling, headings, rich text, timers, buttons, and
// sanitized HTML). `role` is accepted for PhaseRouter's shared renderer
// signature and deliberately unused.
export function ContentPageRenderer({
  content,
  phase,
  sessionId,
  playerId,
}: {
  content: ContentPageContent
  phase: Phase
  role: Role
  sessionId: string
  playerId?: string
}) {
  // Question blocks are dropped, never rendered inert. A content page is
  // reading material by design — the CMS offers it only text/image/video/button
  // (BlockEditor's `allowQuestion` defaults off and ContentPage never opts in) —
  // but `question` is schema-legal in any Block[], and rendering one would write
  // answers that can never be graded AND leak: flush.ts's resolveCorrectness has
  // no `content` case (every answer scores 0), while extractAnswersForPhase
  // carries no per-phase namespace yet, so an answer submitted here would land
  // in the durable results of every later phase.
  //
  // A publish-time guard is not enough on its own. The publish pipeline is
  // manual, so a bundle can reach this runtime without passing publishValidate —
  // the same reasoning behind Blocks.tsx's SAFE_BUTTON_URL.
  const blocks = content.blocks.filter((block) => block.kind !== 'question')

  return (
    <div className="bg-helden-base flex min-h-dvh flex-col text-white">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
        <StepBody
          stepId={phase.id}
          // Inert — `disabled` below means no rendered block reads this qId, and
          // question blocks never survive the filter above. Same stand-in spirit
          // as Presentation/index.tsx and PathQuestion.tsx.
          microStepId={phase.id}
          blocks={blocks}
          header={null}
          answers={{}}
          drafts={{}}
          onDraftChange={() => {}}
          // Read-only page. Only QuestionView and ButtonBlock read this flag,
          // and only the latter is reachable here — so a copy/external button
          // stays visible but inert. `disabled={false}` is deliberately NOT
          // used: it would render a live copy button that writes nothing.
          disabled
          // Microlearning's reading treatment (framed 4:3 image, title and
          // caption stacked below) rather than Presentation's projected
          // full-bleed slide — this page is read on phones as well as screens.
          imageVariant="contained"
          sessionId={sessionId}
          phase={phase}
          playerId={playerId ?? ''}
        />
      </div>
    </div>
  )
}
