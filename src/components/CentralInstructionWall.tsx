import { assets } from '@/assets'

const mmss = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`

export type InstructionStep = { title: string; body: string; illustration: React.ReactNode }

// Central "how to play" wall (Figma 1920×1080): timer band on top, two numbered
// instruction cards side by side, a "n dari m ... telah menjawab" band below.
// Shared by the self-paced challenge minigames (analyze_grid, sort_order). Sizes
// are in vw so the wall scales to any projector.
export function CentralInstructionWall({
  timer,
  steps,
  answered,
  total,
  unit = 'pemain',
}: {
  timer?: { active: boolean; remainingSec: number; expired: boolean }
  steps: InstructionStep[]
  answered: number
  total: number
  unit?: string
}) {
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

        <div className="flex min-h-0 flex-1 items-center justify-center gap-[1.7vw] px-[2.9vw] py-[1.7vw]">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="flex h-full min-h-0 flex-1 flex-col gap-[0.8vw] rounded-[0.2vw] border border-[#353535] bg-[rgba(8,8,8,0.72)] p-[1.25vw]"
            >
              <div className="min-h-0 flex-1 overflow-hidden border border-[#353535] bg-black/50">
                {s.illustration}
              </div>
              <div className="flex items-center gap-[0.8vw]">
                <span className="bg-helden-yellow-gradient flex size-[2.5vw] shrink-0 items-center justify-center rounded-full text-[1.4vw] font-bold text-black">
                  {i + 1}
                </span>
                <h2 className="text-[2.1vw] leading-[1.2] font-semibold text-white">{s.title}</h2>
              </div>
              <p className="text-[1.56vw] leading-[1.25] font-light text-white">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="flex h-[8%] shrink-0 items-center justify-center bg-black/40">
          <p className="text-[1.667vw] leading-[1.2] text-white">
            <span className="text-helden-yellow font-bold">{answered}</span> dari{' '}
            <span className="text-helden-yellow font-bold">{Math.max(total, answered)}</span> {unit}{' '}
            telah menjawab
          </p>
        </div>
      </div>
    </div>
  )
}
