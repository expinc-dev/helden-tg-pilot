// Small CSS-only mock-ups for the central instruction cards (Figma "how to play"
// panels). Illustrations only — nothing here reads or writes game state.

const Handle = () => (
  <span className="flex w-[1.5vw] flex-col gap-[0.3vw]">
    {[0, 1, 2].map((i) => (
      <span key={i} className="h-[0.15vw] bg-[#fddb00]" />
    ))}
  </span>
)

const Badge = ({ n }: { n: number }) => (
  <span className="bg-helden-yellow flex size-[2.4vw] shrink-0 items-center justify-center rounded-full text-[1.2vw] font-bold text-black">
    {n}
  </span>
)

// Drag-to-order list (sort_order).
export function SortMock() {
  return (
    <div className="flex h-full flex-col gap-[0.9vw] overflow-hidden px-[3.5vw] py-[1.2vw]">
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          className="flex h-[6.5vw] shrink-0 items-center gap-[1.2vw] rounded-[0.6vw] border border-[#353535] bg-black/40 px-[1.4vw]"
        >
          <Badge n={n} />
          <span className="h-[3vw] flex-1 bg-[#2b2b2b]" />
          <Handle />
        </div>
      ))}
    </div>
  )
}

// Analysis form (analyze_grid): a question line and option rows.
export function GridMock() {
  return (
    <div className="flex h-full flex-col gap-[0.9vw] overflow-hidden px-[3.5vw] py-[1.2vw]">
      <div className="h-[1.6vw] w-[70%] shrink-0 bg-[#2b2b2b]" />
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex h-[4.2vw] shrink-0 items-center gap-[1vw] rounded-[0.6vw] border border-[#353535] bg-black/40 px-[1.2vw]"
        >
          <span
            className={`size-[1.4vw] rounded-full border-2 ${i === 1 ? 'border-[#fddb00] bg-[#fddb00]' : 'border-[#6b6b6b]'}`}
          />
          <span className="h-[1.2vw] flex-1 bg-[#2b2b2b]" />
        </div>
      ))}
    </div>
  )
}

// The "Kumpulkan" button, shared by both levels.
export function SubmitMock() {
  return (
    <div className="flex h-full items-center justify-center overflow-hidden px-[2vw]">
      <div className="bg-helden-yellow-gradient flex h-[4.2vw] w-[31vw] items-center justify-center rounded-[0.9vw] text-[1.5vw] font-semibold text-black">
        Kumpulkan
      </div>
    </div>
  )
}
