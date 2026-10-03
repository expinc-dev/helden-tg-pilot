import { useState } from 'react'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { GradientButton } from '@/components/GradientButton'
import { Icon } from '@iconify/react'

import { BACK_TO_PICKER_CONFIRM } from './confirmCopy'

export function BackToPicker({ onBack }: { onBack: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 flex items-center gap-1 text-xs text-white/40 hover:text-white/70"
      >
        <Icon icon="mdi:chevron-left" className="size-4" />
        Kembali ke Daftar Level
      </button>
      {open && (
        <ConfirmDialog
          {...BACK_TO_PICKER_CONFIRM}
          onCancel={() => setOpen(false)}
          onConfirm={() => {
            setOpen(false)
            onBack()
          }}
        />
      )}
    </>
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
        className="h-12 w-full rounded-lg bg-[#2A2A2A] text-center text-sm font-semibold text-white/30"
      >
        {children}
      </button>
    )
  }
  return (
    <GradientButton type="button" onClick={onClick} className="h-12 w-full text-sm">
      {children}
    </GradientButton>
  )
}

// A short accent tick + heading, reused above both text-block headings and
// question prompts so the two read as the same visual "card title" language.
export function SectionHeading({ text }: { text: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-1 w-8 rounded-full bg-[#FFB800]" />
      <h2 className="text-lg font-bold text-[#FFB800]">{text}</h2>
    </div>
  )
}
