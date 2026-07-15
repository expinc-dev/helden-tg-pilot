import type { PresentationSlideExtras } from '@/lib/demoBundle'

export function SplitSidebarSlide({
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
  const boxStyle = {
    borderRadius: '4px',
    border: '1px solid var(--Stroke-Container, #353535)',
    background: '#080808',
  }

  return (
    <div className="flex flex-1 gap-6 p-6">
      <div
        className="flex-1 overflow-hidden bg-center"
        style={{
          ...boxStyle,
          backgroundImage: image ? `url(${image})` : undefined,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      />

      <div className="flex w-[38%] min-w-[280px] flex-col gap-6">
        {timerText && (
          <div className="flex items-center justify-center p-6" style={boxStyle}>
            <p className="text-5xl font-bold text-yellow-400 tabular-nums">{timerText}</p>
          </div>
        )}

        <div className="flex flex-1 flex-col p-6" style={boxStyle}>
          {title && (
            <div className="mb-6 flex flex-col gap-4">
              <p className="text-center text-2xl font-bold text-yellow-400">{title}</p>
              <div className="border-t" style={{ borderColor: '#353535' }} />
            </div>
          )}
          <p className="mb-4 text-base font-semibold text-white">{details.heading}</p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-white">{details.body}</p>
        </div>
      </div>
    </div>
  )
}
