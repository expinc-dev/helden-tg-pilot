import type { Block } from '@helden-inc/tg-schema'

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
          <img
            src={block.mediaId}
            alt={block.caption ?? ''}
            className="aspect-video w-full rounded-2xl object-cover"
          />
          {block.caption && (
            <figcaption className="text-xs text-white/40">{block.caption}</figcaption>
          )}
        </figure>
      )
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
    default:
      return <p className="text-xs text-white/40">Unsupported block: {block.kind}</p>
  }
}
