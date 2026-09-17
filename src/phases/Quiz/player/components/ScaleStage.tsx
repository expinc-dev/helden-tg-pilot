import { assets } from '@/assets'

import { renderPromptBlocks } from '@/lib/richText'

import type { ScaleQuestion } from '../../scale'
import { scaleOptionId } from '../../scale'

// HLN-012. A scale statement is private and ungraded: the player taps one point
// and the answer is sealed immediately — no reveal, no right/wrong, no score,
// no leaderboard. The only post-submit state is the same neutral
// "Jawaban tersimpan!" wait the choice questions use, so nothing on this screen
// can hint at what anyone else answered.
//
// The statement sits here, on the player's own device, because that is what
// `on_device` means — the player reads and answers without looking up at the
// central screen. The host also shows it so the facilitator can read it aloud.
//
// Deliberately no TimerRing even when a phase carries a server timer: an
// attitude statement is not a race, and control.ts disarms the timer node for
// on_device entirely.
export function ScaleStage({
  question,
  points,
  submitted,
  selectedValue,
  canAnswer,
  onAnswer,
}: {
  question: ScaleQuestion
  points: number[]
  submitted: string | number | null
  selectedValue: number | null
  canAnswer: boolean
  onAnswer: (value: number) => void
}) {
  const [minLabel, maxLabel] = question.labels ?? []

  return (
    <div
      className="flex min-h-dvh flex-col"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.auth})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {submitted !== null ? (
        <div className="-mt-10 flex flex-1 flex-col items-center justify-center gap-4 px-10">
          <p className="text-4xl font-semibold text-white">Jawaban tersimpan!</p>
          <p className="text-center text-xl text-white/90">Menunggu pemain lain menjawab...</p>
        </div>
      ) : (
        <>
          <div className="px-8 pt-10">
            <p className="text-2xl leading-relaxed font-normal text-white">
              {renderPromptBlocks(question.prompt)}
            </p>
          </div>

          {/* Horizontal scale, endpoints labelled — an even number of points and
              no middle dot, so there is no "neutral" to hide behind. */}
          <div className="mt-auto flex flex-col gap-3 px-8 pb-12">
            <div className="flex items-stretch gap-2">
              {points.map((value) => {
                const isSelected = selectedValue === value
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={!canAnswer}
                    onClick={() => onAnswer(value)}
                    aria-label={`${value}`}
                    aria-pressed={isSelected}
                    className="flex flex-1 flex-col items-center gap-2 rounded-xl py-4 shadow-lg transition-all duration-200 ease-out active:scale-[0.97] disabled:cursor-not-allowed"
                    style={{
                      background: isSelected ? '#FDDB00' : '#1F1F1F',
                      border: `1px solid ${isSelected ? '#FDDB00' : '#99A3AE'}`,
                      opacity: !canAnswer && !isSelected ? 0.5 : 1,
                    }}
                  >
                    <span
                      className="text-2xl font-bold"
                      style={{ color: isSelected ? '#1F1F1F' : '#fff' }}
                    >
                      {scaleOptionId(value)}
                    </span>
                  </button>
                )
              })}
            </div>

            {(minLabel || maxLabel) && (
              <div className="flex justify-between text-sm text-white/70">
                <span className="max-w-[45%]">{minLabel}</span>
                <span className="max-w-[45%] text-right">{maxLabel}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
