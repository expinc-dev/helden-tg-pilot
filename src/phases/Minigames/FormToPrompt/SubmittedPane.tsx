import { Icon } from '@iconify/react'

// Shown after a form-to-prompt answer lands.
//
// Deliberately NOT the doubt-seed SavedConfirmation with a "show it on the wall"
// button: `teamMode: individual` (HLN-005) and the privacy line running through
// the whole L4 arc mean there is nothing to share and nowhere to look. What the
// participant needs now is the next instruction — the prompt is already copied
// and Gemini is already open — so the screen repeats the sequence instead of
// congratulating them.
//
// Extracted from player.tsx so the submit path stays readable; one caller.

export function SubmittedPane({
  pathLabel,
  hasEmptyRequired,
}: {
  pathLabel: string
  hasEmptyRequired: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2 animate-bounce rounded-full bg-[#FDDB00]"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
      <p className="text-xl font-bold text-[#FFB800]">Jawaban tersimpan!</p>
      <p className="text-sm text-white/50">
        Jalur kamu: <span className="text-white/80">{pathLabel}</span>
      </p>
      {hasEmptyRequired && (
        <p className="max-w-xs text-sm text-[#FFB800]/80">
          Ada isian yang masih kosong — prompt tadi memakai penanda {`'[kosong]'`}. Kamu masih bisa
          mengulang setelah sesi ini.
        </p>
      )}
      <div className="mt-2 flex items-center gap-2 text-xs text-white/40">
        <Icon icon="mdi:check-circle-outline" className="size-4" />
        Boleh lanjut ngobrol dengan Gemini — host akan memberi aba-aba berikutnya.
      </div>
    </div>
  )
}
