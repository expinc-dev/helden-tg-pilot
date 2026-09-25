import type { Phase } from '@helden-inc/tg-schema'

import { useGallerySpotlight } from '@/lib/sync/useGallerySpotlight'

import { pageForTick, paginate } from '../TeamSelfie/grid'
import { useTick } from '../TeamSelfie/useTick'
import {
  GALLERY_SPOTLIGHT_CAP,
  GENERIC_VERSION_CAPTION,
  GENERIC_VERSION_TEXT,
  cardTextIndex,
  pinnedGallery,
  submittedGalleryEntries,
} from './gallery'
import type { GalleryCardEntry } from './gallery'
import type { DoubtSeedConfig } from './score'
import { useGalleryAnswers, useGalleryRoster } from './useGallery'

// How many team versions share one rotating page. Deliberately the same three
// as the host's curation cap (GALLERY_SPOTLIGHT_CAP): both exist so a version
// stays readable from the back of the room, not for any layout reason.
const PAGE_CAPACITY = 3
const ROTATE_MS = 6000

/**
 * The gallery itself — the storyboard's contrast, not a grid of submissions: the
 * left panel is the one GENERIC AI description every team was shown, the right
 * panel is the teams' own souled versions.
 *
 * Un-pinned it rotates through pages of three, the way the room has seen it
 * since HLN-003. Once the host pins a version — "these two contrast the most" —
 * the board drops the rotation and holds exactly those versions, in pin order,
 * so the room looks at the frame the host is talking about.
 *
 * The pinned keys come from useGallerySpotlight, so both screens that render
 * this board — the central and the host — show the same curation without either
 * of them owning the state. The host's chip strip writes through
 * setGallerySpotlight in lib/session/control.ts.
 *
 * Nothing here is ranked, and no player or team names appear anywhere — "Tim
 * A/B/C" is positional. That is an explicit acceptance criterion (HLN-003), so
 * do not add labels here. It holds for the host's curation chips too: a chip is
 * a positional label, and the pin order — never the underlying identity — is
 * what the room sees.
 */
export function GalleryBoard({
  sessionId,
  phase,
  config,
  onToggle,
}: {
  sessionId: string
  phase: Phase
  config: DoubtSeedConfig
  /** Present only on the host's screen: renders the per-version pin chips. */
  onToggle?: (key: string) => void
}) {
  const spotlight = useGallerySpotlight(sessionId)
  const roster = useGalleryRoster(sessionId, phase)
  const answers = useGalleryAnswers(sessionId, roster, phase.id)
  const entries = submittedGalleryEntries(roster, answers, cardTextIndex(config))
  const pinned = pinnedGallery(entries, spotlight)

  // Rotation only makes sense in the un-pinned fallback. A curated wall is a
  // chosen frame, so it stays still until the host changes it.
  const tick = useTick(pinned.length > 0 ? 0 : ROTATE_MS)
  const pages = paginate(entries, PAGE_CAPACITY)
  const pageIndex = pageForTick(tick, pages.length)

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[1fr_1.6fr] gap-10">
      <GenericPanel />
      <div className="flex min-h-0 flex-col gap-4">
        {entries.length === 0 ? (
          <EmptyGallery />
        ) : pinned.length > 0 ? (
          // Pinned order is the host's, not submission order, and there is only
          // ever one page of them — so no pagination dots.
          <TeamVersions page={pinned} pageIndex={0} pageCount={1} />
        ) : (
          <TeamVersions page={pages[pageIndex]} pageIndex={pageIndex} pageCount={pages.length} />
        )}
        {onToggle && entries.length > 0 && (
          <CurationBar entries={entries} pinned={spotlight} onToggle={onToggle} />
        )}
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

// One page of team versions — a team shows up the moment its leader submits, so
// the wall fills in as the room finishes.
function TeamVersions({
  page,
  pageIndex,
  pageCount,
}: {
  page: GalleryCardEntry[]
  pageIndex: number
  pageCount: number
}) {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        {page.map((entry) => (
          <article
            key={entry.key}
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

// The host's curation strip (HLN-003): one chip per submitted version, labelled
// exactly the way the wall labels it. Clicking a chip pins or unpins that
// version; the room's screen follows within the same read cycle.
//
// Chips, not team names — this strip is the one place a host could be tempted to
// identify a team, so it stays positional on purpose. At the cap the remaining
// chips render disabled rather than quietly ignoring the click: the host needs
// to see *why* the fourth version did not stick.
function CurationBar({
  entries,
  pinned,
  onToggle,
}: {
  entries: GalleryCardEntry[]
  pinned: string[]
  onToggle: (key: string) => void
}) {
  const atCap = pinned.length >= GALLERY_SPOTLIGHT_CAP
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-helden-sub text-xs font-semibold tracking-wide uppercase">
        Kurasi {pinned.length}/{GALLERY_SPOTLIGHT_CAP}
      </span>
      {entries.map((entry) => {
        const isPinned = pinned.includes(entry.key)
        return (
          <button
            key={entry.key}
            type="button"
            onClick={() => onToggle(entry.key)}
            disabled={!isPinned && atCap}
            aria-pressed={isPinned}
            className={
              isPinned
                ? 'border-helden-accent bg-helden-accent/20 text-helden-title cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40'
                : 'border-helden-sub/40 text-helden-sub hover:border-helden-accent hover:text-helden-title cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-normal disabled:cursor-not-allowed disabled:opacity-40'
            }
          >
            {entry.label}
          </button>
        )
      })}
    </div>
  )
}
