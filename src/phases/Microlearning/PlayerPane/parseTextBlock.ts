// Splits a leading markdown "#"/"##" line into a heading, the rest into body
// paragraphs — enough to match the design's heading+description card without
// pulling in a full markdown renderer. Content with no leading "#" just
// renders as body paragraphs (no heading tick).
export function parseTextBlock(markdown: string): { heading?: string; paragraphs: string[] } {
  const lines = markdown.split('\n')
  const headingMatch = lines[0]?.match(/^#{1,6}\s+(.*)$/)
  if (headingMatch) {
    return {
      heading: headingMatch[1],
      paragraphs: lines.slice(1).filter((l) => l.trim().length > 0),
    }
  }
  return { paragraphs: lines.filter((l) => l.trim().length > 0) }
}
