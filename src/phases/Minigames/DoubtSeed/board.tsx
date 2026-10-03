import type { Phase } from '@helden-inc/tg-schema'

import { useGallerySpotlight } from '@/lib/sync/useGallerySpotlight'

import { pageForTick, paginate } from '../TeamSelfie/grid'
import { useTick } from '../TeamSelfie/useTick'
import {
  GALLERY_PAGE_CAPACITY,
  cardTextIndex,
  galleryGrid,
  pinnedGallery,
  submittedGalleryEntries,
} from './gallery'
import type { GalleryCardEntry } from './gallery'
import type { DoubtSeedConfig } from './score'
import { useGalleryAnswers, useGalleryRoster } from './useGallery'

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
  const gallery = config.gallery
  const compact = !!onToggle
  // A switched-off gallery must not cost a listener, let alone one per team
  // (the central screen is a shared projector on a shared connection). Passing
  // an undefined session id is the hooks' own "not subscribed" idiom — every
  // lib/sync hook short-circuits on it — so disabling the gallery stops the
  // reads rather than only hiding the result.
  const gallerySessionId = gallery.enabled ? sessionId : undefined
  const spotlight = useGallerySpotlight(gallerySessionId)
  const roster = useGalleryRoster(gallerySessionId, phase)
  const answers = useGalleryAnswers(gallerySessionId, roster, phase.id)
  const entries = submittedGalleryEntries(roster, answers, cardTextIndex(config))
  const pinned = pinnedGallery(entries, spotlight)

  // Rotation only makes sense in the un-pinned fallback. A curated wall is a
  // chosen frame, so it stays still until the host changes it.
  const tick = useTick(pinned.length > 0 ? 0 : ROTATE_MS)
  const pages = paginate(entries, GALLERY_PAGE_CAPACITY)
  const pageIndex = pageForTick(tick, pages.length)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {!gallery.enabled ? (
          <GalleryDisabled />
        ) : entries.length === 0 ? (
          <EmptyGallery />
        ) : pinned.length > 0 ? (
          // Pinned order is the host's, not submission order, and there is only
          // ever one page of them — so no pagination dots.
          <TeamVersions page={pinned} pageIndex={0} pageCount={1} compact={compact} />
        ) : (
          <TeamVersions
            page={pages[pageIndex]}
            pageIndex={pageIndex}
            pageCount={pages.length}
            compact={compact}
          />
        )}
        {onToggle && gallery.enabled && entries.length > 0 && (
          <CurationBar entries={entries} pinned={spotlight} cap={gallery.cap} onToggle={onToggle} />
        )}
      </div>
    </div>
  )
}

// One page of team versions — a team shows up the moment its leader submits, so
// the wall fills in as the room finishes. Central: a bordered-tile grid sized by
// how many versions there are (galleryGrid); host (compact): one column.
function TeamVersions({
  page,
  pageIndex,
  pageCount,
  compact,
}: {
  page: GalleryCardEntry[]
  pageIndex: number
  pageCount: number
  compact?: boolean
}) {
  const grid = galleryGrid(page.length)
  const chipSize = compact
    ? 'px-3 py-1.5 text-sm'
    : page.length <= 3
      ? 'px-[1vw] py-[0.6vw] text-[1.6vw]'
      : 'px-[0.8vw] py-[0.45vw] text-[1.15vw]'
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div
        className={
          compact
            ? 'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto'
            : 'grid min-h-0 flex-1 gap-[1.04vw]'
        }
        style={
          compact
            ? undefined
            : {
                gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${grid.rows}, minmax(0, 1fr))`,
              }
        }
      >
        {page.map((entry) => (
          <article
            key={entry.key}
            className={`flex min-h-0 flex-col gap-4 rounded-2xl border-2 border-[#353535] bg-[#121212] ${compact ? 'p-4' : 'p-[1.25vw]'}`}
          >
            <p
              className={`font-semibold tracking-[-0.04em] text-[#fddb00] ${compact ? 'text-base' : 'text-[1.25vw]'}`}
            >
              {entry.label}
            </p>
            {/* Scrolls rather than clips: a team whose cards outgrow its tile
                would otherwise lose the tail silently, and the whole point of
                this wall is that a participant can find their own words. */}
            <div className="flex min-h-0 flex-wrap content-start gap-3 overflow-y-auto">
              {entry.cards.map((text, i) => (
                <span
                  key={i}
                  className={`rounded-lg border border-[#353535] bg-[#1e1e1e] leading-snug font-normal tracking-[-0.04em] text-white ${chipSize}`}
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
                  ? 'size-2 rounded-full bg-[#fddb00]'
                  : 'size-2 rounded-full bg-[#fddb00] opacity-30'
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
    <div className="flex size-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-[#353535] text-center">
      <p className="text-2xl font-light tracking-[-0.04em] text-[#ccc]">
        Menunggu tim menyusun versi mereka…
      </p>
    </div>
  )
}

// The gallery is switched off for this phase (CMS `gallery.enabled: false`).
// Shown as a deliberate state rather than an empty wall: the host needs to know
// the difference between "nobody has submitted yet" and "this was turned off".
function GalleryDisabled() {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 text-center">
      <p className="text-helden-sub text-2xl font-light">Galeri dimatikan untuk sesi ini.</p>
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
  cap,
  onToggle,
}: {
  entries: GalleryCardEntry[]
  pinned: string[]
  cap: number
  onToggle: (key: string) => void
}) {
  const atCap = pinned.length >= cap
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-helden-sub text-xs font-semibold tracking-wide uppercase">
        Kurasi {pinned.length}/{cap}
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
