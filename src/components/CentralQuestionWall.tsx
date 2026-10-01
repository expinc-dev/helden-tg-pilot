import { assets } from '@/assets'

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
  compact = false,
  children,
}: {
  prompt: React.ReactNode
  // Omit (or pass active:false) to leave the top band empty.
  timer?: { active: boolean; remainingSec: number; expired: boolean }
  // Omit `answered` to hide the counter.
  answered?: number
  total?: number
  // compact: question sits at the top (smaller) and `children` fill the middle
  // (kahoot option cards). Default: question centred, large.
  compact?: boolean
  children?: React.ReactNode
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
      <div className="flex h-[12.5%] shrink-0 items-center justify-center bg-black/50">
        {timer?.active &&
          (timer.expired ? (
            <span className="text-5xl font-bold text-[#E21B3C]">Time’s up</span>
          ) : (
            <span className="text-helden-yellow text-6xl font-bold tabular-nums">
              {mmss(timer.remainingSec)}
            </span>
          ))}
      </div>

      {compact ? (
        <div className="flex min-h-0 flex-1 flex-col gap-10 px-[3.5%] py-[3%]">
          <h1 className="px-[6%] text-center text-5xl leading-snug font-medium text-white">
            {prompt}
          </h1>
          <div className="flex min-h-0 flex-1 flex-col justify-center">{children}</div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center px-[10%]">
          <h1 className="text-center text-7xl leading-tight font-medium text-white">{prompt}</h1>
        </div>
      )}

      <div className="flex h-[7.5%] shrink-0 items-center justify-center bg-black/60">
        {answered !== undefined && (
          <p className="text-3xl text-white">
            <span className="text-helden-yellow font-medium">{answered}</span> dari{' '}
            <span className="text-helden-yellow font-medium">{total ?? 0}</span> pemain telah
            menjawab
          </p>
        )}
      </div>
    </div>
  )
}
