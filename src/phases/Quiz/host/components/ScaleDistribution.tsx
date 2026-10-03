import { useDistribution } from '../../lib'
import { type ScaleQuestion, scaleOptionId, scalePoints } from '../../scale'
import { BarRow } from './HostQuizParts'

// Per-point vote counts for a scale statement, A = the strongest agreement
// (same ordering the player and central screens use). The most-voted row is
// highlighted yellow.
export function ScaleDistribution({
  sessionId,
  qId,
  question,
}: {
  sessionId: string
  qId: string
  question: ScaleQuestion
}) {
  const dist = useDistribution(sessionId, qId)
  const points = scalePoints(question).reverse()
  const counts = points.map((v) => dist[scaleOptionId(v)] ?? 0)
  const max = Math.max(0, ...counts)
  const total = counts.reduce((a, b) => a + b, 0) || 1
  return (
    <div className="flex flex-col gap-4">
      {points.map((v, i) => (
        <BarRow
          key={v}
          letter={String.fromCharCode(65 + i)}
          count={counts[i]}
          pct={Math.round((counts[i] / total) * 100)}
          accent={max > 0 && counts[i] === max ? '#fddb00' : undefined}
        />
      ))}
    </div>
  )
}
