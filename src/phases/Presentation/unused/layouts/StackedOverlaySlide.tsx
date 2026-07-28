export function StackedOverlaySlide({
  image,
  heading,
  body,
  timerText,
  isTimerSlide,
}: {
  image?: string
  heading: string
  body: string
  timerText: string | false
  isTimerSlide?: boolean
}) {
  if (isTimerSlide) {
    return (
      <div className="flex flex-1 p-6">
        <div
          className="relative flex flex-1 flex-col overflow-hidden"
          style={{
            borderRadius: '4px',
            border: '0.5px solid var(--om-accent-dark-blue-40, #99A3AE)',
            background: image
              ? `linear-gradient(0deg, rgba(0, 0, 0, 0.48) 0%, rgba(0, 0, 0, 0.48) 100%), linear-gradient(0deg, rgba(26, 50, 58, 0.6) 0%, rgba(26, 50, 58, 0.6) 100%), url(${image}) center / cover no-repeat #1A323A`
              : '#1A323A',
          }}
        >
          <div className="relative z-10 flex flex-1 flex-col">
            {timerText && (
              <p
                className="m-auto text-7xl font-bold text-yellow-400 tabular-nums"
                style={{ textShadow: '0 0 16px rgba(250, 204, 21, 0.6)' }}
              >
                {timerText}
              </p>
            )}

            <div
              className="mt-auto flex flex-col gap-1 p-5"
              style={{ background: 'rgba(8, 8, 8, 0.75)' }}
            >
              <p className="text-sm font-bold text-yellow-400">{heading}</p>
              <p className="text-xs whitespace-pre-wrap text-white/80">{body}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 p-6">
      <div
        className="relative flex flex-1 flex-col overflow-hidden bg-neutral-950 bg-cover bg-center"
        style={{
          borderRadius: '4px',
          border: '0.5px solid var(--om-accent-dark-blue-40, #99A3AE)',
          backgroundImage: image ? `url(${image})` : undefined,
        }}
      >
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 flex flex-1 flex-col">
          {timerText && (
            <div className="px-4 py-3 text-center" style={{ background: '#080808A3' }}>
              <p className="text-4xl font-bold text-yellow-400 tabular-nums">{timerText}</p>
            </div>
          )}

          <div
            className="mt-auto flex flex-col gap-1 p-4"
            style={{ background: 'rgba(8, 8, 8, 0.75)' }}
          >
            <p className="text-sm font-semibold text-yellow-400">{heading}</p>
            <p className="text-xs whitespace-pre-wrap text-white/80">{body}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
