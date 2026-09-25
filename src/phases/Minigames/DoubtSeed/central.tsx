import { useMemo } from 'react'

import type { Phase } from '@helden-inc/tg-schema'

import { pageForTick, paginate } from '../TeamSelfie/grid'
import { useTick } from '../TeamSelfie/useTick'
import {
  GENERIC_VERSION_CAPTION,
  GENERIC_VERSION_TEXT,
  cardTextIndex,
  submittedGalleryEntries,
} from './gallery'
import type { DoubtSeedConfig } from './score'
import { useGalleryAnswers, useGalleryRoster } from './useGallery'

// How many team versions share the wall before the central rotates. Three is
// the curation size the storyboard fixes ("Host kurasi 2–3 versi paling
// kontras"), and it keeps each version readable from the back of the room.
const PAGE_CAPACITY = 3
const ROTATE_MS = 6000

// Central gallery (HLN-003, storyboard §7). Full-bleed by design — the central
// screen special-cases this template so the standard padding/timer chrome is
// skipped and the contrast can use the whole wall.
//
// Composition is the storyboard's core argument, not a grid of submissions:
// the left panel is the one GENERIC AI description every team was shown, the
// right panel is the teams' own souled versions, rotating three at a time.
// Nothing here is interactive and nothing is ranked — host curation happens by
// talking over the wall, so the gallery needs no new RTDB node and no new
// security rule.
//
// No player or team names appear anywhere — "Tim A/B/C" is positional. That is
// an explicit acceptance criterion (HLN-003), so do not add labels here.
export function DoubtSeedCentral({
  sessionId,
  phase,
  config,
}: {
  sessionId: string
  phase: Phase
  config: DoubtSeedConfig
}) {
  const roster = useGalleryRoster(sessionId, phase)
  const answers = useGalleryAnswers(sessionId, roster, phase.id)
  const index = useMemo(() => cardTextIndex(config), [config])
  const entries = useMemo(
    () => submittedGalleryEntries(roster, answers, index),
    [roster, answers, index]
  )

  const tick = useTick(ROTATE_MS)
  const pages = paginate(entries, PAGE_CAPACITY)
  const pageIndex = pageForTick(tick, pages.length)

  return (
    <div className="bg-helden-base fixed inset-0 flex items-center justify-center p-11">
      <div className="relative flex size-full max-h-[929px] max-w-[1832px] flex-col gap-10 rounded-2xl bg-[#080808] p-8">
        {phase.title && (
          <header className="text-center">
            <h1 className="bg-helden-yellow-gradient bg-clip-text text-[54px] leading-[74px] font-bold tracking-[-2.16px] text-transparent">
              {phase.title}
            </h1>
          </header>
        )}

        <div className="grid min-h-0 flex-1 grid-cols-[1fr_1.6fr] gap-10">
          <GenericPanel />
          <div className="min-h-0">
            {entries.length === 0 ? (
              <EmptyGallery />
            ) : (
              <TeamVersions
                page={pages[pageIndex]}
                pageIndex={pageIndex}
                pageCount={pages.length}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// The control version: identical for every team, and deliberately unremarkable.
// It stays on screen the whole time so the room can compare without waiting for
// its page to come around.
function GenericPanel() {
  return (
    <section className="bg-helden-surface-gradient flex flex-col gap-6 rounded-2xl p-8 opacity-60">
      <p className="text-helden-sub text-lg font-semibold tracking-wide uppercase">Versi AI</p>
      <p className="text-helden-body text-3xl leading-snug font-light">{GENERIC_VERSION_TEXT}</p>
      <p className="text-helden-sub mt-auto text-xl font-normal italic">
        {GENERIC_VERSION_CAPTION}
      </p>
    </section>
  )
}

// One page of team versions, newest arrangement first — a team shows up the
// moment its leader submits, so the wall fills in as the room finishes.
function TeamVersions({
  page,
  pageIndex,
  pageCount,
}: {
  page: { label: string; cards: string[] }[]
  pageIndex: number
  pageCount: number
}) {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        {page.map((entry) => (
          <article
            key={entry.label}
            className="bg-helden-photo-gradient flex min-h-0 flex-1 flex-col gap-4 rounded-2xl p-6"
          >
            <p className="text-helden-sub text-lg font-semibold tracking-wide uppercase">
              {entry.label}
            </p>
            <div className="flex flex-wrap content-start gap-3 overflow-hidden">
              {entry.cards.map((text, i) => (
                <span
                  key={i}
                  className="text-helden-body bg-helden-base rounded-lg px-4 py-2 text-2xl leading-snug font-normal"
                >
                  {text}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

      {pageCount > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pageCount }, (_, i) => (
            <span
              key={i}
              className={
                i === pageIndex
                  ? 'bg-helden-sub size-2 rounded-full'
                  : 'bg-helden-sub size-2 rounded-full opacity-30'
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyGallery() {
  return (
    <div className="bg-helden-photo-gradient/40 flex size-full flex-col items-center justify-center gap-4 rounded-2xl text-center">
      <p className="text-helden-body text-2xl font-light">Menunggu tim menyusun versi mereka…</p>
    </div>
  )
}
