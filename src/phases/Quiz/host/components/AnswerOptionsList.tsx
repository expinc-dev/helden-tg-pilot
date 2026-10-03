import { type ChoiceOption, useDistribution } from '../../lib'
import { BarRow, TileRow } from './HostQuizParts'

// Host-only option list. Two options read as Kahoot tiles (colour block +
// label); more read as lettered rows. Pre-reveal there is no live
// distribution, so the host can't spoil results by reading the screen;
// post-reveal each row grows a proportional bar + count, with the correct
// option in green.
export function AnswerOptionsList({
  sessionId,
  phaseId,
  questionIndex,
  options,
  revealed,
  correctId,
}: {
  sessionId: string
  phaseId: string
  questionIndex: number
  options: ChoiceOption[]
  revealed: boolean
  correctId?: string
}) {
  const dist = useDistribution(sessionId, `${phaseId}_q${questionIndex}`)
  const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1
  const tiles = options.length <= 2

  return (
    <div className={`flex w-full flex-col ${tiles ? 'gap-6' : 'gap-4'}`}>
      {options.map((opt, i) => {
        const count = dist[opt.id] ?? 0
        const pct = Math.round((count / total) * 100)
        const isCorrect = revealed && correctId === opt.id
        if (tiles) {
          return (
            <TileRow
              key={opt.id}
              index={i}
              label={opt.label}
              count={revealed ? count : undefined}
              pct={revealed ? pct : undefined}
              state={revealed ? (isCorrect ? 'correct' : 'wrong') : undefined}
            />
          )
        }
        return (
          <BarRow
            key={opt.id}
            letter={String.fromCharCode(65 + i)}
            label={opt.label}
            count={revealed ? count : undefined}
            pct={revealed ? pct : undefined}
            accent={isCorrect ? '#51ce92' : undefined}
          />
        )
      })}
    </div>
  )
}
