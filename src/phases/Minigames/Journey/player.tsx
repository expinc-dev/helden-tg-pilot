import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { PlayerScreenFrame } from '@/components/PlayerScreenFrame'
import type { Phase } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'
import { onValue } from 'firebase/database'

import { eref } from '@/lib/firebase'
import type { Seed } from '@/lib/session/seeds'
import { useSeeds } from '@/lib/sync/useSeeds'

import { seedSourceLabel } from '../FormToPrompt/score'
import {
  type JourneyConfig,
  readJourneyCommitment,
  readJourneyPrompt,
  seedSpecsFrom,
} from './score'

// HLN-014 "Bagian 2" — Perjalananmu, on the participant's phone.
//
// One scroll, three sections: the seed they planted at L1, the prompt they built
// in L4, the commitment they just wrote — then the closing line. Storyboard:
// "ringkasan personal — benih + apa yang dibuat + komitmen, dalam satu layar
// 'yang kamu bawa pulang'".
//
// Read-only by construction. Every value here was written by an earlier phase
// into the participant's OWN seat; nothing on this screen can be edited, and
// nothing is re-submitted. So it is a scroll, not a form — and the sections are
// rendered only when their source exists, because a participant who skipped L4
// should see a shorter journey, not an empty box apologising for itself.
//
// Three reads, three patterns, all of them the repo's own:
//   seeds      → useSeeds (HLN-002), one `onlyOnce` listener per seed qId
//   prompt     → one `onlyOnce` listener on the L4b answer
//   commitment → one `onlyOnce` listener on the Closing Bagian 1 answer
// The last two are separate hooks rather than one, because their phase ids come
// from two independent config fields and either may be blank — a config that
// omits L4 must not prevent the commitment from loading.
//
// No bundle is passed to useSeeds, matching the L4 form: a seed renders without
// its category label rather than importing an author-editable module into a
// player-facing screen. `choiceLabel` degrades to undefined by contract, so a
// seed arriving here simply has no `category`.
export function JourneyPlayer({
  sessionId,
  writerId,
  config,
}: {
  phase: Phase
  sessionId: string
  writerId: string
  config: JourneyConfig
}) {
  const specs = useMemo(() => seedSpecsFrom(config.seedBindings), [config.seedBindings])
  const seeds = useSeeds(sessionId, writerId, specs)

  const prompt = useOwnAnswer(sessionId, writerId, config.formToPromptPhaseId, readJourneyPrompt)
  const commitment = useOwnAnswer(
    sessionId,
    writerId,
    config.commitmentPhaseId,
    readJourneyCommitment
  )

  const hasAnything = seeds.length > 0 || !!prompt || !!commitment

  // Figma "Ringkasan": title + hint, then the recap as bordered cards inside
  // one scrolling panel.
  return (
    <PlayerScreenFrame panelClassName="gap-5 p-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-xl leading-[1.2] font-semibold tracking-[-0.04em] text-white">
          Ringkasan
        </h2>
        {config.instructions && (
          <p className="text-sm leading-[1.4] tracking-[-0.04em] whitespace-pre-line text-[#ccc]">
            {config.instructions}
          </p>
        )}
      </div>

      {seeds.length > 0 && (
        <Section heading={config.seedsHeading}>
          {seeds.map((seed, i) => (
            <SeedCard key={`${seed.source}-${i}`} seed={seed} />
          ))}
        </Section>
      )}

      {prompt && (
        <Section heading={config.promptHeading}>
          {prompt.pathLabel && (
            <p className="text-xs font-semibold tracking-wide text-[#FDDB00] uppercase">
              {prompt.pathLabel}
            </p>
          )}
          {/* Scrollable + monospace: the L4 prompt is far taller than a phone
              screen, and the participant recognises it by its shape. */}
          <pre className="max-h-56 overflow-y-auto rounded-lg border border-[#353535] bg-black/40 p-3 text-[11px] leading-5 whitespace-pre-wrap text-white/70">
            {prompt.prompt}
          </pre>
        </Section>
      )}

      {commitment && (
        <Section heading={config.commitmentHeading}>
          <p className="rounded-lg border border-[#FDDB00]/40 bg-[#FDDB00]/5 p-4 text-base leading-7 whitespace-pre-wrap text-white">
            {commitment.text}
          </p>
        </Section>
      )}

      {/* A participant who reached the recap with nothing written still gets
          the closing line — it is addressed to them, not to the data. */}
      {!hasAnything && (
        <p className="text-sm leading-6 text-white/40">Belum ada yang tercatat dari sesi ini.</p>
      )}

      {config.closingLine && (
        <p className="border-t border-[#353535] pt-5 text-center text-base leading-7 font-semibold text-[#FDDB00]">
          {config.closingLine}
        </p>
      )}
    </PlayerScreenFrame>
  )
}

/**
 * One section, one `onlyOnce` listener on the participant's own answer node.
 *
 * The read path is literally the writer's path
 * (`sessions/{id}/players/{writerId}/answers/{phaseId}`, see
 * lib/sync/submitAnswer.ts) — not a scan of any collection — which is what makes
 * this legal for a player: `sessions/$sid/players` is `.read: "auth != null"`,
 * and by extension an earlier phase's answer inside their own seat.
 *
 * Re-subscribes only when one of the three primitives changes, so a config
 * object rebuilt each render does not churn listeners. A blank phaseId is a
 * deliberate no-op (that section is simply omitted from the event), NOT an
 * error — an event that runs the closing without L4 is a valid authoring
 * choice.
 *
 * `onlyOnce: true` throughout: this is the last screen of the day and nothing
 * it shows can change while it is open.
 *
 * `parse` receives the RAW snapshot value and unwraps `{ value, submittedAt }`
 * itself (see readJourneyPrompt), exactly as every other reader in this repo
 * does — which is why this hook does not unwrap a second time.
 */
function useOwnAnswer<T>(
  sessionId: string | undefined,
  writerId: string | undefined,
  phaseId: string,
  parse: (raw: unknown) => T | undefined
): T | undefined {
  // Identity of what is being read, and the guard for reading nothing at all.
  // Blank until both the seat and the phase are known — either config field may
  // legitimately be empty, and a blank one means this section is not part of the
  // event rather than that something went wrong.
  const key = sessionId && writerId && phaseId ? `${sessionId}/${writerId}/${phaseId}` : ''

  // The value is stored TOGETHER with the key it was read under. That is what
  // lets the render below drop a stale value when the key changes without the
  // effect ever calling setState synchronously — clearing state from an effect
  // body is a cascading render for no benefit.
  const [read, setRead] = useState<{ key: string; value: T | undefined }>({
    key: '',
    value: undefined,
  })

  useEffect(() => {
    if (!sessionId || !writerId || !phaseId) return
    return onValue(
      eref(`sessions/${sessionId}/players/${writerId}/answers/${phaseId}`),
      (snap) => setRead({ key: `${sessionId}/${writerId}/${phaseId}`, value: parse(snap.val()) }),
      { onlyOnce: true }
    )
    // `parse` is a module-level function in every call site, but it is an
    // argument, so it belongs in the deps.
  }, [sessionId, writerId, phaseId, parse])

  return read.key === key ? read.value : undefined
}

function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5 rounded-lg border border-[#353535] p-4">
      {heading && (
        <h2 className="text-xs font-semibold tracking-wide text-white/40 uppercase">{heading}</h2>
      )}
      {children}
    </section>
  )
}

// The seed card, matching the L4 chooser's treatment (source label / category /
// the participant's own words) minus the "this points somewhere, pick any path"
// hint — that belongs to the moment of choice and reads as noise on a recap.
//
// The label comes from seedSourceLabel rather than a local ternary so the two
// screens that show a seed say the same thing about where it came from.
function SeedCard({ seed }: { seed: Seed }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-white/[0.04] p-3.5">
      <span className="flex items-center gap-1.5 text-[11px] text-white/40">
        <Icon icon="mdi:sprout-outline" className="size-3.5" />
        {seedSourceLabel(seed.source)}
        {seed.category && <span className="text-white/25">· {seed.category}</span>}
      </span>
      <p className="text-sm leading-6 text-white/85">{seed.text}</p>
    </div>
  )
}
