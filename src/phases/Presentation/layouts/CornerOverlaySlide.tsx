export function CornerOverlaySlide({
  image,
  title,
  timerText,
}: {
  image?: string
  title?: string
  timerText: string | false
}) {
  const bareTimer = !!timerText

  if (bareTimer && image) {
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
          <div className="relative z-10 flex flex-1 flex-col p-6">
            {title && (
              <div
                className="w-fit rounded border px-4 py-2"
                style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.6)' }}
              >
                <p className="text-sm font-semibold text-yellow-400">{title}</p>
              </div>
            )}
            <p
              className="m-auto text-5xl font-bold text-yellow-400 tabular-nums"
              style={{ textShadow: '0 0 16px rgba(250, 204, 21, 0.6)' }}
            >
              {timerText}
            </p>
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

        <div className="relative z-10 flex flex-1 flex-col p-6">
          {title && (
            <div
              className="w-fit rounded border px-4 py-2"
              style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.6)' }}
            >
              <p className="text-sm font-semibold text-yellow-400">{title}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
