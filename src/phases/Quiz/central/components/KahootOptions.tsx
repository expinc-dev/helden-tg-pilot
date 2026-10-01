import { Icon } from '@iconify/react'

import { type ChoiceOption, OPTION_COLORS, OPTION_ICONS } from '../../lib'

// Ribbon/tag notch on the right edge of each tab — fixed pixel depth so it
// stays a crisp point regardless of the card's rendered width.
const CHEVRON_CLIP = 'polygon(0 0, calc(100% - 28px) 0, 100% 50%, calc(100% - 28px) 100%, 0 100%)'

const TAB_CLASS = [
  'bg-quiz-red-gradient',
  'bg-quiz-blue-gradient',
  'bg-quiz-yellow-gradient',
  'bg-quiz-green-gradient',
]

const BODY = [
  { border: '1px solid #E92D23', tint: 'rgba(233, 45, 35, 0.20)' },
  { border: '1px solid #236BED', tint: 'rgba(35, 107, 237, 0.20)' },
  { border: '1px solid #FBB90A', tint: 'rgba(251, 185, 10, 0.20)' },
  { border: '1px solid #41CB43', tint: 'rgba(65, 203, 67, 0.20)' },
]

// Kahoot answer cards on the wall: colored chevron tab with the option's shape
// icon, tinted dark body with the label. Players only see the icons on their
// phones, so this is where each shape is tied to its answer. On `reveal` the
// correct card is lifted and ringed, the rest fade back.
export function KahootOptions({
  options,
  revealed,
  correctId,
}: {
  options: ChoiceOption[]
  revealed: boolean
  correctId?: string
}) {
  if (options.length === 0) return null
  return (
    <div className="grid w-full grid-cols-2 gap-6">
      {options.map((opt, i) => {
        const color = OPTION_COLORS[i % OPTION_COLORS.length]
        const body = BODY[i % BODY.length]
        const isCorrect = revealed && correctId === opt.id
        const isFaded = revealed && !isCorrect
        return (
          <div
            key={opt.id}
            className="relative h-80 transition-all duration-300"
            style={{
              opacity: isFaded ? 0.25 : 1,
              transform: isCorrect ? 'scale(1.03)' : 'scale(1)',
            }}
          >
            <div
              className="relative flex h-full items-center overflow-hidden rounded-md"
              style={{
                border: body.border,
                background: `linear-gradient(0deg, ${body.tint} 0%, ${body.tint} 100%), #1E1E1D`,
                boxShadow: isCorrect ? `0 0 0 3px ${color.bg}` : undefined,
              }}
            >
              <div
                className={`flex h-full w-[22%] shrink-0 items-center justify-center ${TAB_CLASS[i % TAB_CLASS.length]}`}
                style={{ clipPath: CHEVRON_CLIP }}
              >
                <Icon
                  icon={OPTION_ICONS[i % OPTION_ICONS.length]}
                  className="size-16 text-black/40"
                />
              </div>
              <span className="flex-1 px-10 text-3xl font-light text-white">{opt.label}</span>
            </div>
            {isCorrect && (
              <span className="absolute -top-3 -right-3 flex size-10 items-center justify-center rounded-full bg-[#26890C] text-white shadow">
                <Icon icon="mdi:check" className="size-6" />
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
