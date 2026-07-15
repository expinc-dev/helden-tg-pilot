import type { PresentationSlideExtras } from '@/lib/demoBundle'

export function CentralTimerDetailsSlide({
  image,
  title,
  details,
  timerText,
}: {
  image?: string
  title?: string
  details: NonNullable<PresentationSlideExtras['details']>
  timerText: string | false
}) {
  return (
    <div className="flex flex-1 p-6">
      <div
        className="relative flex flex-1 flex-col"
        style={{
          borderRadius: '4px',
          border: '0.5px solid var(--om-accent-dark-blue-40, #99A3AE)',
          background: `linear-gradient(0deg, rgba(0, 0, 0, 0.48) 0%, rgba(0, 0, 0, 0.48) 100%), linear-gradient(0deg, rgba(26, 50, 58, 0.6) 0%, rgba(26, 50, 58, 0.6) 100%), url(${image}) center / cover no-repeat #1A323A`,
        }}
      >
        <div className="relative z-10 flex flex-1 flex-col">
          {title && (
            <div className="p-6 pb-0">
              <div
                className="w-fit rounded border px-4 py-2"
                style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.6)' }}
              >
                <p className="text-sm font-semibold text-yellow-400">{title}</p>
              </div>
            </div>
          )}

          {timerText && (
            <p
              className="m-auto text-6xl font-bold text-yellow-400 tabular-nums"
              style={{ textShadow: '0 0 16px rgba(250, 204, 21, 0.6)' }}
            >
              {timerText}
            </p>
          )}

          <div
            className="m-6 mt-auto flex flex-col gap-1 rounded border p-5"
            style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.85)' }}
          >
            <p className="text-lg font-bold text-yellow-400">{details.heading}</p>
            <p className="text-sm whitespace-pre-wrap text-white/80">{details.body}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
