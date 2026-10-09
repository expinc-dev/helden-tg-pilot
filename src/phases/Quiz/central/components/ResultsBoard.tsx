import { assets } from '@/assets'

export type ResultRow = {
  id: string
  letter: string
  label: string
  count: number
  highlight: boolean
}

// Central results board: the question top-left, one row per option (lettered
// circle, label, count, distribution bar) with the highlighted row tinted
// yellow, and a footer with the answered-progress bar + counter. Used for the
// kahoot reveal and for scale statements once votes exist.
export function ResultsBoard({
  prompt,
  rows,
  answered,
  total,
  unit = 'pemain',
}: {
  prompt: React.ReactNode
  rows: ResultRow[]
  answered: number
  total: number
  // What is being counted ("pemain" / "tim").
  unit?: string
}) {
  const pct = (n: number) => (total > 0 ? Math.min(100, (n / total) * 100) : 0)

  return (
    <div
      className="fixed inset-0 flex flex-col gap-4 p-[3%]"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.central})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto rounded-md border px-[5%] py-[3%]"
        style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.55)' }}
      >
        <h1 className="text-5xl leading-tight font-medium text-white">{prompt}</h1>

        <div className="flex flex-col gap-4">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-3 rounded-sm px-8 py-6"
              style={
                row.highlight
                  ? { background: 'rgba(253, 219, 0, 0.1)' }
                  : { border: '1px solid #353535', background: 'rgba(8, 8, 8, 0.4)' }
              }
            >
              <div className="flex items-center gap-6">
                <span
                  className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 text-2xl font-medium"
                  style={{
                    borderColor: '#FDDB00',
                    background: row.highlight ? '#FDDB00' : 'transparent',
                    color: row.highlight ? '#000' : '#FDDB00',
                  }}
                >
                  {row.letter}
                </span>
                <span className="flex-1 text-3xl font-semibold text-white">{row.label}</span>
                <span className="text-3xl font-medium text-white tabular-nums">{row.count}</span>
              </div>
              <div className="ml-[72px] h-4 overflow-hidden rounded-full bg-[#353535]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct(row.count)}%`,
                    background: row.highlight ? '#FDDB00' : '#6B6B6B',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="flex shrink-0 items-center gap-6 rounded-sm border px-2 py-2"
        style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.55)' }}
      >
        <div className="h-8 flex-1 overflow-hidden rounded-sm bg-white/5">
          <div
            className="bg-helden-yellow-gradient h-full transition-all duration-500"
            style={{ width: `${pct(answered)}%` }}
          />
        </div>
        <p className="shrink-0 pr-4 text-2xl text-white">
          <span className="text-helden-yellow font-semibold">{answered}</span> dari{' '}
          <span className="text-helden-yellow font-semibold">{total}</span> {unit} telah menjawab
        </p>
      </div>
    </div>
  )
}
