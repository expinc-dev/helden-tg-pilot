import { assets } from '@/assets'

// Central "Kemajuan Tim" (Figma Central Screen – Progress): numbered rows, an
// initial badge, the team label and a green bar over a grey track. Nameless
// beyond the team label by design — public screen.
export function CentralTeamProgress({
  rows,
}: {
  rows: { id: string; label: string; pct: number }[]
}) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(${assets.images.backgrounds.central})` }}
    >
      <h1 className="pt-[1.9vw] pb-[1.2vw] text-[1.667vw] leading-[1.2] font-semibold text-white">
        Kemajuan Tim
      </h1>
      <div className="flex min-h-0 w-[88vw] flex-1 [scrollbar-width:none] flex-col gap-[0.5vw] overflow-y-auto bg-black/20 px-[1.5vw] py-[0.8vw]">
        {rows.map((r, i) => (
          <div key={r.id} className="flex items-center gap-[1.2vw]">
            <span className="w-[1.6vw] text-right text-[0.8vw] font-semibold text-white">
              {i + 1}.
            </span>
            <span className="flex size-[1.45vw] shrink-0 items-center justify-center rounded-full bg-white text-[0.7vw] font-bold text-black">
              {r.label.slice(0, 1).toUpperCase()}
            </span>
            <span className="w-[12vw] truncate text-[0.85vw] text-white">{r.label}</span>
            <span className="relative h-[0.35vw] flex-1 overflow-hidden bg-[#9b9b9b]">
              <span
                className="absolute inset-y-0 left-0 bg-[#51ce92] transition-all duration-500"
                style={{ width: `${r.pct}%` }}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
