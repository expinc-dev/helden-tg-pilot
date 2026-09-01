import { useState } from 'react'

import { Modal } from '@/components/Modal'
import { ScannerPopup } from '@/components/scan/ScannerPopup'
import type { Phase, ScanPoints } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { playCorrectSound, playWrongSound } from '@/lib/scan/feedbackSound'
import { MATCH_THRESHOLD } from '@/lib/scan/patternHash'
import { awardScanPoints } from '@/lib/session/scanScoring'

import { ActionButton, SectionHeading } from './shared'

type ScanDraft = { matched: boolean }

const DEFAULT_POINTS: ScanPoints = { correct: 10, wrongPenalty: 10 }

// Shared UI for qr_scan/pattern_scan — identical flow (idle → camera popup →
// correct/wrong feedback), the only difference between the two qTypes is
// which image field holds the reference/target and which `detect` function
// runs on a captured frame. QuestionView.tsx supplies both per qType.
export function ScanQuestion({
  prompt,
  imageUrl,
  points,
  detect,
  answer,
  draft,
  onDraftChange,
  disabled,
  sessionId,
  phase,
  playerId,
}: {
  prompt: React.ReactNode
  imageUrl: string | undefined
  points: ScanPoints | undefined
  detect: (frame: ImageData) => Promise<{ matched: boolean; distance?: number }>
  answer: unknown
  draft: unknown
  onDraftChange: (value: unknown) => void
  disabled: boolean
  sessionId: string
  phase: Phase
  playerId: string
}) {
  const committed = (answer ?? draft) as ScanDraft | null
  const { correct, wrongPenalty } = points ?? DEFAULT_POINTS

  const [popupOpen, setPopupOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [result, setResult] = useState<'wrong' | 'correct' | null>(
    committed?.matched === true ? 'correct' : null
  )
  const [checking, setChecking] = useState(false)
  const [lastDistance, setLastDistance] = useState<number | undefined>(undefined)

  const handleCapture = async (frame: ImageData) => {
    setPopupOpen(false)
    setChecking(true)
    const { matched, distance } = await detect(frame)
    setChecking(false)
    setLastDistance(distance)
    if (matched) {
      setResult('correct')
      onDraftChange({ matched: true } satisfies ScanDraft)
      playCorrectSound()
      void awardScanPoints(sessionId, phase, playerId, correct)
    } else {
      setResult('wrong')
      playWrongSound()
      void awardScanPoints(sessionId, phase, playerId, -wrongPenalty)
    }
  }

  if (result === 'correct') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#26890C]/40 bg-[#26890C]/10 p-5 text-center">
        <h2 className="text-lg font-bold text-[#26890C]">Jawabanmu Benar!</h2>
        <p className="text-sm text-white/80">
          Kamu mendapatkan <span className="font-bold text-[#26890C]">+{correct} poin</span>
        </p>
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            className="aspect-square w-2/3 rounded-xl border border-white/10 object-cover"
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {result === 'wrong' ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-[#E21B3C]/40 bg-[#E21B3C]/10 p-5 text-center">
          <h2 className="text-lg font-bold text-[#E21B3C]">Oops, Jawabanmu Salah!</h2>
          <p className="text-sm text-white/80">
            <span className="font-bold text-[#E21B3C]">-{wrongPenalty} poin</span> dikurangi dari
            skormu.
          </p>
          <p className="text-xs text-white/60">Coba lagi menyusun balok sesuai target!</p>
          {lastDistance !== undefined && (
            <p className="text-xs text-white/40">
              Debug: jarak {lastDistance}/256 (batas {MATCH_THRESHOLD})
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <SectionHeading text={prompt} />
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            className="flex shrink-0 items-center gap-1 rounded border px-2.5 py-1.5 text-xs font-semibold text-[#FFB800]"
            style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.6)' }}
          >
            <Icon icon="mdi:lightbulb-on-outline" className="size-4" />
            Petunjuk
          </button>
        </div>
      )}

      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="aspect-square w-full rounded-2xl border border-white/10 object-cover"
        />
      )}

      <button
        type="button"
        onClick={() => setInfoOpen(true)}
        className="flex items-center gap-3 rounded-xl border px-4 py-3 text-left"
        style={{ borderColor: '#353535', background: '#1F1F1F' }}
      >
        <Icon icon="mdi:information-outline" className="size-6 shrink-0 text-[#FFB800]" />
        <div>
          <p className="text-sm font-semibold text-white">Cara Bermain</p>
          <p className="text-xs text-white/50">
            Klik bagian ini untuk mendapat informasi mengenai permainan ini.
          </p>
        </div>
      </button>

      <ActionButton onClick={() => setPopupOpen(true)} disabled={disabled || checking}>
        {checking ? 'Memindai…' : result === 'wrong' ? 'Coba Lagi' : 'Buka Kamera Pemindai'}
      </ActionButton>

      {popupOpen && (
        <ScannerPopup
          title="Pindai Balok"
          instructions="Pindai balok yang telah Anda susun sesuai target yang ditampilkan sebelumnya, lalu klik tombol kamera untuk memproses lebih lanjut."
          onCapture={(frame) => void handleCapture(frame)}
          onClose={() => setPopupOpen(false)}
        />
      )}

      {infoOpen && (
        // ponytail: no dedicated "hint" field on qr_scan/pattern_scan yet —
        // reuses the prompt content already shown on the card. Add a real
        // hint field if a genuinely different modal body is needed later.
        <Modal title="Cara Bermain" onClose={() => setInfoOpen(false)} dismissOnBackdrop>
          <div className="text-sm text-white/70">{prompt}</div>
        </Modal>
      )}
    </div>
  )
}
