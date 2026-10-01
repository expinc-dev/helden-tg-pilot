import { useCallback, useEffect, useRef, useState } from 'react'

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

// Drag offset (from the default bottom-right anchor) survives phase changes:
// callers remount the panel per phase, and the host should not have to drag it
// back every time. Module-level on purpose — session-lifetime only.
let savedOffset = { dx: 0, dy: 0 }

export function HostScriptPanel({ phase }: { phase: Phase | null }) {
  // Seeded from improvMarker so the marker is showing the moment the host
  // lands on an improvisation step. Callers key this component by phase id, so
  // moving between phases re-seeds instead of carrying the previous state.
  const [open, setOpen] = useState(phase?.hostScript?.improvMarker === true)
  const [offset, setOffset] = useState(savedOffset)
  const rootRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number; dx: number; dy: number } | null>(null)

  // Pull `cur` back inside the positioned frame. The rendered rect already
  // includes `cur`, so subtract it to get the un-offset base position. When the
  // panel is larger than the frame the range collapses to its top-left edge
  // (never inverts), so the drag handle at the top stays reachable.
  const clampOffset = useCallback((cur: { dx: number; dy: number }) => {
    const el = rootRef.current
    const parent = el?.offsetParent as HTMLElement | null
    if (!el || !parent) return cur
    const pr = parent.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    const baseLeft = r.left - cur.dx
    const baseTop = r.top - cur.dy
    const minDx = pr.left - baseLeft
    const maxDx = Math.max(minDx, pr.right - (baseLeft + r.width))
    const minDy = pr.top - baseTop
    const maxDy = Math.max(minDy, pr.bottom - (baseTop + r.height))
    return {
      dx: Math.min(Math.max(cur.dx, minDx), maxDx),
      dy: Math.min(Math.max(cur.dy, minDy), maxDy),
    }
  }, [])

  const reclamp = useCallback(() => {
    setOffset((prev) => {
      const c = clampOffset(prev)
      return Math.abs(c.dx - prev.dx) < 0.5 && Math.abs(c.dy - prev.dy) < 0.5 ? prev : c
    })
  }, [clampOffset])

  // Re-clamp whenever the panel's size can change (script opened, long text,
  // phase swap) or the frame does (resize / rotation), not only while dragging.
  // ResizeObserver also fires once on observe, so the initial position is covered.
  useEffect(() => {
    const el = rootRef.current
    const parent = el?.offsetParent as HTMLElement | null
    if (!el) return
    const ro = new ResizeObserver(reclamp)
    ro.observe(el)
    if (parent) ro.observe(parent)
    window.addEventListener('resize', reclamp)
    window.addEventListener('orientationchange', reclamp)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', reclamp)
      window.removeEventListener('orientationchange', reclamp)
    }
  }, [reclamp])
  useEffect(() => {
    savedOffset = offset
  }, [offset])

  const onDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { x: e.clientX, y: e.clientY, dx: offset.dx, dy: offset.dy }
  }
  const onDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (!d) return
    // Clamp against the currently rendered position, then apply the pointer delta.
    const base = { dx: d.dx + (e.clientX - d.x), dy: d.dy + (e.clientY - d.y) }
    const el = rootRef.current
    const parent = el?.offsetParent as HTMLElement | null
    if (!el || !parent) return setOffset(base)
    const pr = parent.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    const baseLeft = r.left - offset.dx
    const baseTop = r.top - offset.dy
    const minDx = pr.left - baseLeft
    const maxDx = Math.max(minDx, pr.right - (baseLeft + r.width))
    const minDy = pr.top - baseTop
    const maxDy = Math.max(minDy, pr.bottom - (baseTop + r.height))
    setOffset({
      dx: Math.min(Math.max(base.dx, minDx), maxDx),
      dy: Math.min(Math.max(base.dy, minDy), maxDy),
    })
  }
  const onDragEnd = () => {
    dragRef.current = null
  }

  if (!phase) return null

  const anchor = phase.hostScript?.anchorScript ?? []
  const prompts = phase.hostScript?.sharingPrompts ?? []
  const improv = phase.hostScript?.improvMarker === true
  const authored = anchor.length > 0 || prompts.length > 0

  // Anchored clear of the host action stack. 11.5rem = 184px, which sits
  // 15px above the tallest one: Quiz's per-stage GradientButton, whose band
  // reaches 169px from the card's bottom edge (`mt-auto` + `pb-10` inside
  // the phase card). The previous bottom-24 (96px) only cleared the generic
  // shell's own 56px button and landed inside that band, so the panel
  // swallowed clicks on the controls it was covering.
  // `absolute`, NOT `fixed`: fixed anchored to the raw browser viewport, so
  // inside TabletFrame's simulated 768x1024 box (lg+) it drifted out of the
  // device frame and needed a hand-rolled `calc(50vw - 24rem)` correction on
  // both axes to be pulled back in. Every caller now owns a `relative`
  // wrapper spanning that same box (pages/host/lobby's live shell plus its
  // video/idle/microlearning early-return wrappers), so the panel is
  // frame-locked by construction and the viewport math is gone.
  // Callers must render it directly inside that wrapper: the panel overlays the
  // phase card, so any intermediate full-inset overlay would need
  // `pointer-events-none` to stay clickable-through, which the panel would then
  // inherit and die on.
  return (
    <div
      ref={rootRef}
      style={{ transform: `translate(${offset.dx}px, ${offset.dy}px)` }}
      // max-h: frame height minus the 11.5rem bottom anchor and a 0.75rem top margin,
      // so the panel can never grow past the top edge; long scripts scroll inside.
      className="absolute right-4 bottom-[11.5rem] z-40 flex max-h-[calc(100%-12.25rem)] w-[min(90vw,26rem)] flex-col gap-2"
    >
      {/* Drag handle: the toggle below stays a plain button, so a tap on it
          never turns into a drag. touch-none keeps tablets from scrolling. */}
      <div
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
        onDoubleClick={() => setOffset({ dx: 0, dy: 0 })}
        aria-label="Geser panel naskah"
        className="mx-auto flex h-8 w-24 shrink-0 cursor-grab touch-none items-center justify-center rounded-full bg-[#121212f2] active:cursor-grabbing"
      >
        <span className="h-1 w-10 rounded-full bg-white/40" />
      </div>

      {/* The improvisation marker is deliberately outside the collapsible body:
          there is no control anywhere in this component that hides it while
          improvMarker is set, so the host cannot lose the cue. */}
      {improv && (
        <div className="shrink-0 rounded-lg bg-[#FFB800] px-3 py-2 text-center text-sm font-black tracking-wide text-black uppercase">
          Host Improvisation
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121212f2] shadow-lg">
        {authored ? (
          <>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex w-full shrink-0 items-center justify-between gap-2 px-3 py-2 text-left"
            >
              <span className="text-helden-yellow text-xs font-semibold tracking-wider uppercase">
                Naskah Host
              </span>
              <span className="text-xs text-white/50">{open ? 'Sembunyikan' : 'Tampilkan'}</span>
            </button>

            {open && (
              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto border-t border-white/10 p-3">
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
