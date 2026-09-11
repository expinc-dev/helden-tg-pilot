import { useCallback, useEffect, useState } from 'react'

import type { Block } from '@helden-inc/tg-schema'
import { toast } from 'sonner'

import { detectProvider, vimeoEmbedUrl, youtubeEmbedUrl } from '@/phases/Video/lib'

import { sanitizeHtml } from '@/lib/sanitizeHtml'
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
}: {
  block: Block
  answer: unknown
  draft: unknown
  onDraftChange: (value: unknown) => void
  disabled: boolean
}) {
  switch (block.kind) {
    case 'text': {
      const { heading, paragraphs } = parseTextBlock(block.markdown)
      return (
        <div className="flex flex-col gap-2">
          {heading && <SectionHeading text={heading} />}
          {paragraphs.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-white/70">
              {p}
            </p>
          ))}
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
          {block.caption && (
            <figcaption className="text-xs text-white/40">{block.caption}</figcaption>
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
        />
      )
    case 'timer':
      return <TimerCountdown seconds={block.seconds} direction={block.direction} />
    case 'heading':
      // Fallback only — when a hero image exists, StepBody pulls the heading
      // block out and overlays it instead of rendering it here in the flow.
      return <p className="text-lg font-bold text-[#FFB800]">{block.text}</p>
    case 'html':
      return (
        <div
          className="max-w-none [&_img]:max-w-full [&_table]:border-collapse [&_td]:border [&_td]:p-1 [&_th]:border [&_th]:p-1"
          // Sanitized above — the only dangerouslySetInnerHTML in the app, and
          // nothing reaches it without passing DOMPurify first.
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.html) }}
        />
      )
    case 'button':
      return <ButtonView block={block} />
  }
}

function ButtonView({ block }: { block: Extract<Block, { kind: 'button' }> }) {
  const isCopy = block.variant === 'copy'
  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied!')
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        toast.success('Copied!')
      } catch {
        // Clipboard denied on both paths — surface a manual-copy hint.
        toast.error('Copy blocked — select and copy manually')
      }
    }
  }, [])

  if (isCopy) {
    return (
      <button
        type="button"
        onClick={() => handleCopy(block.text ?? '')}
        className="rounded-lg bg-[#FFB800] px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
      >
        {block.label || 'Copy'}
      </button>
    )
  }
  const url = block.url?.trim()
  return (
    <a
      href={url || undefined}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={!url}
      className={`inline-block rounded-lg bg-[#FFB800] px-4 py-2 text-sm font-semibold text-black transition ${
        url ? 'hover:opacity-90' : 'pointer-events-none opacity-50'
      }`}
    >
      {block.label || 'Open link'} ↗
    </a>
  )
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
