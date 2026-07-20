import { GradientButton } from '@/components/GradientButton'
import { Icon } from '@iconify/react'

export function BackToPicker({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="mb-4 flex items-center gap-1 text-xs text-white/40 hover:text-white/70"
    >
      <Icon icon="mdi:chevron-left" className="size-4" />
      Kembali ke Daftar Level
    </button>
  )
}

// Full-width primary action, swapping between the app's yellow gradient
// (ready) and a flat dark disabled state — mirrors the Figma "Selanjutnya"
// button across every step-card variant.
export function ActionButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-lg bg-[#2A2A2A] py-3.5 text-center text-sm font-semibold text-white/30"
      >
        {children}
      </button>
    )
  }
  return (
    <GradientButton type="button" onClick={onClick} className="w-full py-3.5 text-sm">
      {children}
    </GradientButton>
  )
}

// A short accent tick + heading, reused above both text-block headings and
// question prompts so the two read as the same visual "card title" language.
export function SectionHeading({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-1 w-8 rounded-full bg-[#FFB800]" />
      <h2 className="text-lg font-bold text-[#FFB800]">{text}</h2>
    </div>
  )
}
