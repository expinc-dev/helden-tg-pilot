import { useEffect, useState } from 'react'

import type { Block, Phase } from '@helden-inc/tg-schema'
import { toast } from 'sonner'

import { detectProvider, vimeoEmbedUrl, youtubeEmbedUrl } from '@/phases/Video/lib'

import { renderInline, renderRichText, renderSegments } from '@/lib/richText'
import { mmss } from '@/lib/sync/timermath'

import { QuestionView } from './QuestionView'
import { parseTextBlock } from './parseTextBlock'
import { SectionHeading } from './shared'

export function BlockView({
  block,
  answer,
  draft,
  onDraftChange,
  disabled,
  qId,
  sessionId,
  phase,
  playerId,
}: {
  block: Block
  answer: unknown
  draft: unknown
  onDraftChange: (value: unknown) => void
  disabled: boolean
  // Only consumed by 'question' blocks whose qType is path_question — the
  // RTDB key it submits its per-case answers map under (see
  // QuestionView.tsx / PathQuestion.tsx). Every other qType still gets
  // committed by PlayerPane's deferred commitCurrentDraft, which computes
  // its own qId the same way and doesn't need this threaded down.
  qId: string
  // Only consumed by 'question' blocks whose qType is qr_scan/pattern_scan —
  // see QuestionView.tsx.
  sessionId: string
  phase: Phase
  playerId: string
}) {
  switch (block.kind) {
    case 'text': {
      const { heading, segments } = parseTextBlock(block.markdown)
      return (
        <div className="flex flex-col gap-2">
          {heading && <SectionHeading text={renderInline(heading)} />}
          {renderSegments(segments, {
            paragraphClassName: 'text-sm leading-relaxed text-white/70',
          })}
        </div>
      )
    }
    case 'image':
      return (
        <figure className="flex flex-col gap-2">
          {block.url ? (
            <img
              src={block.url}
              alt={block.caption ?? ''}
              className="aspect-video w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="aspect-video w-full rounded-2xl bg-white/5" />
          )}
          {block.title && (
            <p className="text-center text-lg font-bold text-[#FFB800]">
              {renderInline(block.title)}
            </p>
          )}
          {block.caption && (
            <div className="text-xs text-white/40">{renderRichText(block.caption)}</div>
          )}
        </figure>
      )
    case 'video': {
      if (!block.url) return <div className="aspect-video w-full rounded-2xl bg-white/5" />
      const provider = detectProvider(block.url)
      return provider === 'direct' ? (
        <video
          src={block.url}
          controls
          autoPlay={block.autoplay}
          playsInline
          className="aspect-video w-full rounded-2xl bg-black object-contain"
        />
      ) : (
        <iframe
          src={
            provider === 'vimeo'
              ? vimeoEmbedUrl(block.url, false, { controls: true, autoplay: block.autoplay })
              : youtubeEmbedUrl(block.url, false, { controls: true, autoplay: block.autoplay })
          }
          allow="autoplay; fullscreen; picture-in-picture"
          className="aspect-video w-full rounded-2xl border-0"
          title="Video"
        />
      )
    }
    case 'question':
      return (
        <QuestionView
          question={block.question}
          answer={answer}
          draft={draft}
          onDraftChange={onDraftChange}
          disabled={disabled}
          qId={qId}
          sessionId={sessionId}
          phase={phase}
          playerId={playerId}
        />
      )
    case 'timer':
      return <TimerCountdown seconds={block.seconds} direction={block.direction} />
    case 'heading':
      // Fallback only — when a hero image exists, StepBody pulls the heading
      // block out and overlays it instead of rendering it here in the flow.
      return <p className="text-lg font-bold text-[#FFB800]">{block.text}</p>
    case 'button':
      return <ButtonBlock block={block} disabled={disabled} />
    default:
      return <p className="text-xs text-white/40">Unsupported block: {block.kind}</p>
  }
}

// Only http(s) may ever reach an <a href>. CMS's publishValidate already
// rejects any other scheme at publish time (see helden-tg-cms's publish.ts /
// validateButtonUrls), but the manual publish pipeline means a bundle can
// reach this runtime without having gone through that check — a `javascript:`
// URL here would execute in the clicking player's page (stored XSS), so this
// is the actual security boundary, not a redundant belt-and-suspenders check.
const SAFE_BUTTON_URL = /^https?:\/\//i

// Bridge to Gemini (or similar): copy a prepared prompt, or open an external
// link. Two variants share this component because CMS's ButtonBlockEditor
// mirrors that split (see helden-tg-cms/src/components/blocks/button/).
function ButtonBlock({
  block,
  disabled,
}: {
  block: Extract<Block, { kind: 'button' }>
  disabled: boolean
}) {
  const className =
    'inline-flex items-center gap-2 rounded-lg bg-[#FFB800] px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none'

  if (block.variant === 'external-link') {
    const rawHref = block.url ?? ''
    const href = SAFE_BUTTON_URL.test(rawHref) ? rawHref : ''
    // `pointer-events-none` when disabled or href empty — an <a> without href
    // is still keyboard-focusable and clickable, so `disabled` alone (an <a>
    // attribute that doesn't exist) isn't enough.
    const inert = disabled || !href
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} ${inert ? 'pointer-events-none opacity-40' : ''}`}
        aria-disabled={inert}
      >
        {block.label || 'Buka'}
        <span aria-hidden>↗</span>
      </a>
    )
  }

  const text = block.text ?? ''
  const inert = disabled || !text
  return (
    <button
      type="button"
      disabled={inert}
      onClick={() => void copyToClipboard(text)}
      className={className}
    >
      {block.label || 'Salin'}
    </button>
  )
}

// ponytail: `navigator.clipboard.writeText` is secure-context-only (HTTPS or
// localhost) — same trap as `crypto.subtle` we already dodge in lib/ids.ts.
// Sessions demoed over LAN HTTP (a tablet + phones on wifi hitting the host's
// IP) land in insecure context, where the property is `undefined`. Fall back
// to the legacy `execCommand('copy')` there — deprecated but still works in
// every browser we ship to, and needs no user permission prompt. Upgrade path:
// once the pilot is only ever served over HTTPS, drop the fallback.
async function copyToClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      if (!ok) throw new Error('execCommand copy returned false')
    }
    toast.success('Disalin ke clipboard')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    toast.error(`Gagal menyalin: ${msg}`)
  }
}

// Cosmetic, client-local countdown (no server authority, no advance-gating —
// see helden-tg-schema's Block.timer comment). Remounts fresh each time the
// step/slide changes because the caller keys this component by step id.
function TimerCountdown({ seconds, direction }: { seconds: number; direction: 'up' | 'down' }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => Math.min(e + 1, seconds)), 1000)
    return () => clearInterval(id)
  }, [seconds])

  const value = direction === 'down' ? Math.max(seconds - elapsed, 0) : elapsed
  return (
    <div className="flex items-center justify-center rounded-2xl bg-white/5 py-4">
      <span className="text-3xl font-bold text-[#FFB800] tabular-nums">{mmss(value)}</span>
    </div>
  )
}
