import { assets } from '@/assets'

import { FitText } from './FitText'

const mmss = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`

// Central "question wall": a dark band on top (timer), the question large in
// the middle, a dark band at the bottom ("N dari M pemain telah menjawab").
// Shared by Quiz and Microlearning so every question screen on the wall reads
// the same.
export function CentralQuestionWall({
  prompt,
  timer,
  answered,
  total,
  unit = 'pemain',
  compact = false,
  children,
}: {
  prompt: React.ReactNode
  // Omit (or pass active:false) to leave the top band empty.
  timer?: { active: boolean; remainingSec: number; expired: boolean }
  // Omit `answered` to hide the counter.
  answered?: number
  total?: number
  // What is being counted ("pemain" / "tim").
  unit?: string
  // compact: question sits at the top (smaller) and `children` fill the middle
  // (kahoot option cards). Default: question centred, large.
  compact?: boolean
  children?: React.ReactNode
}) {
  // Sizes follow the Figma 1920×1080 frames in vw so the wall scales to any
  // projector: timer 64, question 90 (54 when options share the wall), counter 32.
  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.central})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col bg-black/[0.24]">
        <div className="flex h-[12.5%] shrink-0 items-center justify-center bg-[rgba(8,8,8,0.64)]">
          {timer?.active &&
            (timer.expired ? (
              <span className="text-[2.5vw] font-bold text-[#E21B3C]">Time’s up</span>
            ) : (
              <span className="text-[3.333vw] font-bold tracking-[-0.04em] text-[#fddb00] tabular-nums">
                {mmss(timer.remainingSec)}
              </span>
            ))}
        </div>

        {compact ? (
          <div className="flex min-h-0 flex-1 flex-col gap-[3vw] pt-[3vw] pb-[2vw]">
            {/* Long authored prompts shrink inside a capped box instead of
                pushing the options off the wall. */}
            <FitText
              baseVw={2.8125}
              className="max-h-[38%] shrink-0 px-[1.667vw] text-center leading-[1.3] font-semibold text-white"
            >
              {prompt}
            </FitText>
            <div className="flex min-h-0 flex-1 flex-col justify-center px-[3.333vw]">
              {children}
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center py-[2vw]">
            <FitText
              baseVw={4.6875}
              minRatio={0.3}
              className="max-h-full max-w-[73.8vw] text-center leading-[1.3] font-semibold text-white"
            >
              {prompt}
            </FitText>
          </div>
        )}

        <div className="flex h-[8%] shrink-0 items-center justify-center bg-black/40">
          {answered !== undefined && (
            <p className="text-[1.667vw] leading-[1.2] text-white">
              <span className="text-helden-yellow font-bold">{answered}</span> dari{' '}
              <span className="text-helden-yellow font-bold">{total ?? 0}</span> {unit} telah
              menjawab
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
