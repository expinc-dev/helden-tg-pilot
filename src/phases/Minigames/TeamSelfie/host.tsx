import { HostPanelHeader } from '@/pages/host/_shared/HostScreenFrame'

import { BENTO_CAPACITY, paginate } from './grid'
import { useAllSelfies } from './useSelfies'

// Host view of the closing selfie wall (Figma "Perjalanan yang Kita Lalui
// Bersama"): the first four team photos in a 2×2 grid. Names never appear —
// the same rule the central mosaic follows.
export function TeamSelfieHost({ sessionId }: { sessionId: string }) {
  const selfies = useAllSelfies(sessionId)
  const photos = paginate(selfies, BENTO_CAPACITY)[0]?.slice(0, 4) ?? []

  return (
    <div className="flex min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:#353535_transparent] flex-col gap-12 overflow-y-auto px-8 pt-10 pb-8">
      <HostPanelHeader
        badge={null}
        title="Perjalanan yang Kita Lalui Bersama"
        subtitle="Tak perlu nama. Hanya kehadiran yang hening dari siapa kita saat bersama."
      />
      <div className="grid grid-cols-2 gap-5 rounded-lg border border-[#353535] bg-black/[0.08] p-5">
        {photos.length === 0 ? (
          <p className="col-span-2 py-16 text-center text-lg font-light text-white/50">
            Menunggu foto tim pertama…
          </p>
        ) : (
          photos.map((s, i) => (
            <div key={i} className="aspect-[3/4] overflow-hidden rounded-lg bg-[#141414]">
              {s.image && <img src={s.image} alt="" className="size-full object-cover" />}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
