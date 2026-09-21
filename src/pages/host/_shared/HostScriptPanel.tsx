import { useState } from 'react'

import type { Block, Phase } from '@helden-inc/tg-schema'

import { detectProvider, vimeoEmbedUrl, youtubeEmbedUrl } from '@/phases/Video/lib'

import { renderRichText } from '@/lib/richText'
import { sanitizeHtml } from '@/lib/sanitizeHtml'

// Host-only phase script, authored per phase in the CMS and read aloud by the
// host at /host. Contract lives in tg-schema's hostScriptSchema: the field is
// on the phase ENVELOPE (sibling of durationMin), and tg-cms's projection
// strips it before a bundle reaches any player device — this component is the
// host side of that split, so it must never be mounted on a player/central
// route. Nothing here reads or writes RTDB: it renders the bundle the host
// already has.
//
// Rendered as a fixed overlay rather than an in-flow block on purpose. The
// host screens (video / idle / microlearning / generic) each own a hand-tuned
// full-bleed layout, and injecting a block into their flow would fight those
// designs; an overlay leaves every one of them untouched while still being
// impossible for a new branch to skip.

// Block kinds the host panel understands. HostScriptEditor only offers
// text/image/video, but the bundle is data — a hand-edited or older bundle can
// carry any kind, so unknown kinds degrade to a visible note instead of
// rendering nothing (silently swallowing the host's script is the failure mode
// that matters).
function HostBlock({ block }: { block: Block }) {
  switch (block.kind) {
    case 'text':
      return (
        <div className="flex flex-col gap-1.5">
          {renderRichText(block.markdown, {
            paragraphClassName: 'text-sm leading-relaxed text-white/85',
            listClassName: 'list-disc space-y-1 pl-5 text-sm leading-relaxed text-white/85',
          })}
        </div>
      )
    case 'heading':
      return <p className="text-base font-bold text-[#FFB800]">{block.text}</p>
    case 'image':
      return (
        <figure className="flex flex-col gap-1.5">
          {block.url ? (
            <img
              src={block.url}
              alt={block.caption ?? ''}
              className="aspect-video w-full rounded-xl object-cover"
            />
          ) : (
            <div className="aspect-video w-full rounded-xl bg-white/5" />
          )}
          {block.caption && (
            <figcaption className="text-xs text-white/50">{block.caption}</figcaption>
          )}
        </figure>
      )
    case 'video': {
      if (!block.url) return <div className="aspect-video w-full rounded-xl bg-white/5" />
      const provider = detectProvider(block.url)
      return provider === 'direct' ? (
        <video
          src={block.url}
          controls
          playsInline
          className="aspect-video w-full rounded-xl bg-black"
        />
      ) : (
        <iframe
          src={
            provider === 'vimeo'
              ? vimeoEmbedUrl(block.url, false, { controls: true })
              : youtubeEmbedUrl(block.url, false, { controls: true })
          }
          allow="autoplay; fullscreen; picture-in-picture"
          className="aspect-video w-full rounded-xl border-0"
          title="Video"
        />
      )
    }
    case 'html':
      // Sanitized before it ever reaches dangerouslySetInnerHTML — same
      // DOMPurify boundary the player panes use.
      return (
        <div
          className="max-w-none text-sm text-white/85 [&_img]:max-w-full"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.html) }}
        />
      )
    case 'timer':
      return <p className="text-xs text-white/50">Timer {block.seconds}s</p>
    case 'question':
      return (
        <p className="text-xs text-white/50">Blok pertanyaan tidak ditampilkan di naskah host.</p>
      )
    case 'button':
      return <p className="text-xs text-white/50">{block.label}</p>
    default: {
      // Every Block kind is handled above, so `block` has narrowed to `never`
      // and there is nothing left to read off it in a type-safe way — a
      // property read here is the TS2339 the player panes already trip over.
      // Widen to `unknown` and narrow with `in` instead. Unreachable for any
      // bundle this build produced; the point is that a bundle carrying an
      // unknown kind shows the host a note rather than silently dropping the
      // rest of their script.
      const unhandled: unknown = block
      const kind =
        typeof unhandled === 'object' &&
        unhandled !== null &&
        'kind' in unhandled &&
        typeof unhandled.kind === 'string'
          ? unhandled.kind
          : 'unknown'
      return <p className="text-xs text-white/40">Unsupported block: {kind}</p>
    }
  }
}

export function HostScriptPanel({ phase }: { phase: Phase | null }) {
  // Seeded from improvMarker so the marker is showing the moment the host
  // lands on an improvisation step. Callers key this component by phase id, so
  // moving between phases re-seeds instead of carrying the previous state.
  const [open, setOpen] = useState(phase?.hostScript?.improvMarker === true)

  if (!phase) return null

  const anchor = phase.hostScript?.anchorScript ?? []
  const prompts = phase.hostScript?.sharingPrompts ?? []
  const improv = phase.hostScript?.improvMarker === true
  const authored = anchor.length > 0 || prompts.length > 0

  return (
    // Anchored above the bottom action button (every host screen pins one at
    // the bottom of the viewport) so the two never collide. At lg+ the app is
    // a centered 768px tablet frame, so `right` is offset to land back inside
    // that frame instead of on the desktop backdrop.
    <div className="fixed right-4 bottom-24 z-40 flex w-[min(90vw,26rem)] flex-col gap-2 lg:right-[calc(50vw-24rem+1rem)]">
      {/* The improvisation marker is deliberately outside the collapsible body:
          there is no control anywhere in this component that hides it while
          improvMarker is set, so the host cannot lose the cue. */}
      {improv && (
        <div className="rounded-lg bg-[#FFB800] px-3 py-2 text-center text-sm font-black tracking-wide text-black uppercase">
          Host Improvisation
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121212f2] shadow-lg">
        {authored ? (
          <>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
            >
              <span className="text-helden-yellow text-xs font-semibold tracking-wider uppercase">
                Naskah Host
              </span>
              <span className="text-xs text-white/50">{open ? 'Sembunyikan' : 'Tampilkan'}</span>
            </button>

            {open && (
              <div className="flex max-h-[55vh] flex-col gap-4 overflow-y-auto border-t border-white/10 p-3">
                {anchor.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[0.65rem] font-semibold tracking-wider text-white/40 uppercase">
                      Naskah
                    </span>
                    {anchor.map((block, i) => (
                      <HostBlock key={i} block={block} />
                    ))}
                  </div>
                )}

                {prompts.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[0.65rem] font-semibold tracking-wider text-white/40 uppercase">
                      Prompt Berbagi
                    </span>
                    {prompts.map((block, i) => (
                      <HostBlock key={i} block={block} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          // The unauthored phase reports this in the header rather than inside
          // the collapsible body — the panel is collapsed by default, so a
          // message hidden behind a toggle is a message the host never reads.
          <div className="flex flex-col gap-0.5 px-3 py-2">
            <span className="text-helden-yellow text-xs font-semibold tracking-wider uppercase">
              Naskah Host
            </span>
            <span className="text-sm text-white/50">No script authored for this phase</span>
          </div>
        )}
      </div>
    </div>
  )
}
