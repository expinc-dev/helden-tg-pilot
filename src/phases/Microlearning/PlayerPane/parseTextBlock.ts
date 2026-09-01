import { type TextSegment, parseBlocks } from '@/lib/richText'

// Splits a leading markdown "#"/"##" line into a heading, the rest into body
// segments (paragraph/list, see richText.parseBlocks) — enough to match the
// design's heading+description card without pulling in a full markdown
// renderer. Content with no leading "#" just renders as body segments (no
// heading tick).
export function parseTextBlock(markdown: string): { heading?: string; segments: TextSegment[] } {
  const lines = markdown.split('\n')
  const headingMatch = lines[0]?.match(/^#{1,6}\s+(.*)$/)
  if (headingMatch) {
    return { heading: headingMatch[1], segments: parseBlocks(lines.slice(1).join('\n')) }
  }
  return { segments: parseBlocks(markdown) }
}
