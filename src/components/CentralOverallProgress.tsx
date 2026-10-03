import { assets } from '@/assets'

// Central "PROGRES KESELURUHAN" screen (Figma 76–102): a huge green % over a
// full-width bar, with the "N dari M pemain telah selesai" strip below. Sizes
// are in vw so the 1920×1080 frame scales to any projector.
export function CentralOverallProgress({ finished, total }: { finished: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((finished / total) * 100)) : 0
  // Figma tiers: 0–30 red, 31–75 yellow, 76–100 green.
  const tone =
    pct <= 30
      ? {
          main: '#ff3b30',
          bar: '#e5271f',
          glow: 'linear-gradient(175deg, #ff6b61 1.4%, #a31a14 100%)',
        }
      : pct <= 75
        ? {
            main: '#fddb00',
            bar: '#fdc300',
            glow: 'linear-gradient(175deg, #ffe84d 1.4%, #b88400 100%)',
          }
        : {
            main: '#90df04',
            bar: '#88d303',
            glow: 'linear-gradient(175deg, #90df04 1.4%, #568700 100%)',
          }
  return (
    <div
      className="fixed inset-0 flex flex-col items-center bg-cover bg-center"
      style={{ backgroundImage: `url(${assets.images.backgrounds.central})` }}
    >
      <p className="mt-[6.2vw] text-[1.667vw] leading-[1.2] font-normal text-white">
        PROGRES KESELURUHAN
      </p>

      <div className="relative flex flex-1 flex-col items-center justify-center">
        <p
          aria-hidden
          className="absolute text-[12.5vw] leading-none font-bold tracking-[0.04em] text-transparent opacity-60 blur-[12px]"
          style={{
            backgroundImage: tone.glow,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
          }}
        >
          {pct}%
        </p>
        <p
          className="relative text-[12.5vw] leading-none font-bold tracking-[0.04em]"
          style={{ color: tone.main }}
        >
          {pct}%
        </p>
      </div>

      <div className="mb-[8.2vw] h-[2.5vw] w-[62.5vw] border border-[#3a3a3a] p-[0.2vw]">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${pct}%`, background: tone.bar, boxShadow: `0 0 6px ${tone.bar}` }}
        />
      </div>

      <div className="mb-[4.5vw] flex items-center justify-center bg-black/40 px-[1.25vw] py-[0.52vw]">
        <p className="text-[1.667vw] leading-[1.2] text-white">
          <span className="font-bold text-[#fddb00]">{finished} </span>dari
          <span className="font-bold text-[#fddb00]"> {total} </span>
          pemain telah selesai
        </p>
      </div>
    </div>
  )
}
