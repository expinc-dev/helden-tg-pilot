import type { ReactNode } from 'react'

import type { Block } from '@helden-inc/tg-schema'

export type TextSegment = { type: 'paragraph'; text: string } | { type: 'list'; items: string[] }

// Splits a markdown body into paragraph/list segments — bullet lines
// ("- item" / "* item") run together into one list, everything else is its
// own paragraph. Deliberately hand-rolled (no markdown library) — matches
// the small syntax subset the CMS's MarkdownToolbar actually produces.
export function parseBlocks(markdown: string): TextSegment[] {
  const segments: TextSegment[] = []
  let currentList: string[] = []
  const flushList = () => {
    if (currentList.length) {
      segments.push({ type: 'list', items: currentList })
      currentList = []
    }
  }
  for (const line of markdown.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/)
    if (bulletMatch) {
      currentList.push(bulletMatch[1])
    } else {
      flushList()
      segments.push({ type: 'paragraph', text: trimmed })
    }
  }
  flushList()
  return segments
}

const INLINE_PATTERN = /\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*/

// Parses **bold**, __underline__, *italic* within one line of text — same
// syntax the CMS's MarkdownToolbar (helden-tg-cms) inserts.
export function renderInline(text: string): ReactNode {
  const parts: ReactNode[] = []
  let rest = text
  let key = 0
  for (;;) {
    const match = rest.match(INLINE_PATTERN)
    if (!match || match.index === undefined) {
      parts.push(rest)
      break
    }
    if (match.index > 0) parts.push(rest.slice(0, match.index))
    if (match[1] !== undefined) parts.push(<strong key={key++}>{match[1]}</strong>)
    else if (match[2] !== undefined) parts.push(<u key={key++}>{match[2]}</u>)
    else parts.push(<em key={key++}>{match[3]}</em>)
    rest = rest.slice(match.index + match[0].length)
  }
  return parts
}

// Renders already-parsed segments (paragraph/list), each line inline-formatted.
export function renderSegments(
  segments: TextSegment[],
  opts?: { paragraphClassName?: string; listClassName?: string }
): ReactNode {
  return segments.map((seg, i) =>
    seg.type === 'list' ? (
      <ul key={i} className={opts?.listClassName ?? 'list-disc space-y-1 pl-5'}>
        {seg.items.map((item, j) => (
          <li key={j}>{renderInline(item)}</li>
        ))}
      </ul>
    ) : (
      <p key={i} className={opts?.paragraphClassName}>
        {renderInline(seg.text)}
      </p>
    )
  )
}

// Full body text — paragraphs and bullet lists, each line inline-formatted.
// Used for a text block's body and an image's title/caption.
export function renderRichText(
  markdown: string,
  opts?: { paragraphClassName?: string; listClassName?: string }
): ReactNode {
  return renderSegments(parseBlocks(markdown), opts)
}

// Same markdown parse as renderRichText, but bullet lists render as a
// numbered stack — each item prefixed by a gold-filled circle badge holding
// its 1-based index. Paragraphs (no `-`/`*` prefix) fall back to plain
// rendering with default typography, so a caption that isn't bulleted still
// looks right. Used by the microlearning image-block "contained" variant to
// match the numbered-rule design; other consumers stay on renderRichText.
export function renderNumberedList(
  markdown: string,
  opts?: { paragraphClassName?: string; itemTextClassName?: string }
): ReactNode {
  const segments = parseBlocks(markdown)
  const itemTextClass = opts?.itemTextClassName ?? 'text-sm'
  return segments.map((seg, i) => {
    if (seg.type === 'paragraph') {
      return (
        <p key={i} className={opts?.paragraphClassName}>
          {renderInline(seg.text)}
        </p>
      )
    }
    return (
      <ol key={i} className="flex flex-col gap-3">
        {seg.items.map((item, j) => (
          <li key={j} className="flex items-start gap-3">
            <span
              className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-black"
              style={{ background: '#FCDC07' }}
            >
              {j + 1}
            </span>
            <span className={`flex-1 text-white/85 ${itemTextClass}`}>{renderInline(item)}</span>
          </li>
        ))}
      </ol>
    )
  })
}

// A question prompt's text blocks, inline-formatted and joined — rendered
// as a single heading line (SectionHeading), so no list/paragraph splitting
// here, just bold/italic/underline within the line.
export function renderPromptBlocks(prompt: Block[]): ReactNode {
  const textBlocks = prompt.filter((b): b is Extract<Block, { kind: 'text' }> => b.kind === 'text')
  return textBlocks.map((b, i) => (
    <span key={i}>
      {i > 0 && ' '}
      {renderInline(b.markdown)}
    </span>
  ))
}
