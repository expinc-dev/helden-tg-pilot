import { AnswerSavedScreen } from '@/components/AnswerSavedScreen'

import type { GalleryCardEntry } from './gallery'
import type { GalleryConfig } from './score'

// The doubt-seed post-submit screen (HLN-003, storyboard §7).
//
// Extracted from player.tsx so it can be rendered without a live session —
// which matters because it is the only place the `optional` mode's keep-private
// choice is visible, and that choice is an acceptance criterion.
//
// Three states, in priority order:
//   gallery off      → the plain "answer saved" confirmation, as before HLN-003
//   gallery on       → the anonymous versions of everyone who has answered, and
//                      in `optional` mode a control to put your own version on
//                      the wall
// Nothing here is ranked and no name appears: `GalleryCardEntry.label` is
// positional ("Tim A/B/C"). Do not add author or team identifiers.
export function SubmittedPane({
  entries,
  gallery,
  shared,
  shareBusy,
  onShare,
}: {
  entries: GalleryCardEntry[]
  gallery: GalleryConfig
  /** Whether this player's own version is on the wall. Always true when not `optional`. */
  shared: boolean
  shareBusy: boolean
  onShare: () => void
}) {
  if (!gallery.enabled) return <SavedConfirmation />

  return (
    <div className="flex min-h-dvh flex-col bg-[#1F1F1F] p-4 text-white sm:p-6">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4">
        <div className="flex flex-col items-center gap-1 pt-2 text-center">
          <p className="text-xl font-bold text-[#FFB800]">Versi kamu tersimpan!</p>
          <p className="text-sm text-white/50">
            Sambil menunggu, baca versi yang lain. Semuanya anonim.
          </p>
        </div>

        {gallery.mode === 'optional' && !shared && (
          <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/70">
              Versimu belum tampil di layar besar. Mau dibagikan?
            </p>
            <button
              type="button"
              disabled={shareBusy}
              onClick={onShare}
              className="w-full rounded-lg bg-[#FFB800] py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {shareBusy ? 'Membagikan…' : 'Bagikan ke galeri'}
            </button>
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4">
          {entries.length === 0 ? (
            <p className="pt-8 text-center text-sm text-white/40">Menunggu pemain lain menjawab…</p>
          ) : (
            entries.map((entry) => (
              <article
                key={entry.key}
                className="shrink-0 rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <p className="pb-3 text-xs font-semibold tracking-wide text-white/50 uppercase">
                  {entry.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {entry.cards.map((text, i) => (
                    <span
                      key={i}
                      className="rounded-lg bg-black/40 px-3 py-1.5 text-sm text-white/80"
                    >
                      {text}
                    </span>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// The pre-HLN-003 confirmation, kept verbatim for sessions that switch the
// gallery off: a facilitator who does not want the wall still needs the player
// to know the answer landed.
function SavedConfirmation() {
  return <AnswerSavedScreen />
}
