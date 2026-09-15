import { useState } from 'react'

import { SelfieCapture } from '@/components/camera/SelfieCapture'
import { serverTimestamp, set } from 'firebase/database'

import { eref } from '@/lib/firebase'

import { type TeamSelfieConfig, selfieKeyId } from './score'
import { useSelfie } from './useSelfies'

type Phase = { id: string; title: string }

// team_selfie player view (HLN-018).
//
// One photo per team, written to sessions/{id}/selfies/{keyId} where keyId is
// the team id in team mode and the player id in a solo session — the exact
// shape the `selfies` rules authorise. team_collaborative means any member may
// shoot, so every member's device is a valid camera except... nothing: unlike
// sort_order we do NOT gate members to a focus screen, because "everyone grab
// the phone" is the point of a team selfie.
//
// The write goes through eref(), i.e. events/{EVENT_ID}/sessions/... — writing
// to a bare `sessions/...` ref would be denied by the rules (that prefix is the
// whole reason eref exists).
export function TeamSelfiePlayer({
  phase,
  config,
  sessionId,
  playerId,
  teamId,
}: {
  phase: Phase
  config: TeamSelfieConfig
  sessionId: string
  playerId: string
  teamId?: string
}) {
  const keyId = selfieKeyId(teamId, playerId)
  const existing = useSelfie(sessionId, keyId)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasPhoto = !!existing?.image
  const canRetake = config.retakeAllowed
  const showCamera = !hasPhoto || editing

  const save = async (dataUrl: string) => {
    setBusy(true)
    setError(null)
    try {
      await set(eref(`sessions/${sessionId}/selfies/${keyId}`), {
        image: dataUrl,
        createdAt: serverTimestamp(),
        updatedBy: playerId,
      })
      // Scoring reads players/{id}/answers/{phaseId}, NOT selfies/ — so a
      // marker has to land there or the flushed score is always 0 even though
      // the photo is on the wall. Small on purpose: the image is already in
      // selfies/{keyId} and there is no reason to store it twice. Written
      // only for the acting player (the leader in team mode), which is exactly
      // the id the flush loop scores.
      await set(eref(`sessions/${sessionId}/players/${playerId}/answers/${phase.id}`), {
        value: { hasPhoto: true, keyId },
        submittedAt: serverTimestamp(),
      })
      setEditing(false)
    } catch (e) {
      // Denied write / offline: surface it instead of leaving the player on a
      // frozen "Menyimpan…" (the failure mode of the earlier minigames).
      setError(
        e instanceof Error && e.message.includes('permission')
          ? 'Tidak punya izin menyimpan foto untuk tim ini.'
          : 'Gagal mengunggah foto. Coba lagi.'
      )
    } finally {
      setBusy(false)
    }
  }

  if (!keyId) {
    return (
      <div className="bg-helden-base flex min-h-dvh flex-col items-center justify-center gap-2 p-6 text-center text-white/60">
        <p className="text-sm">Menunggu identitas pemain…</p>
      </div>
    )
  }

  if (showCamera) {
    return (
      <SelfieCapture
        title={phase.title || 'Take a team selfie'}
        instructions={config.finalLine}
        actionLabel={hasPhoto ? 'Save Memory' : 'Join the Team Circle'}
        compress={{ maxPx: config.maxImagePx, quality: config.jpegQuality }}
        onSave={save}
        onClose={() => (hasPhoto ? setEditing(false) : undefined)}
      />
    )
  }

  return (
    <div className="bg-helden-base flex min-h-dvh flex-col p-6 text-white">
      <div className="bg-helden-surface-gradient mx-auto flex w-full max-w-md flex-1 flex-col overflow-hidden rounded-2xl p-8">
        <h2 className="text-helden-title text-center text-[28px] leading-9 font-bold tracking-tight">
          {phase.title || 'Your team selfie'}
        </h2>
        <p className="text-helden-sub mt-2 text-center text-base leading-6 font-light">
          {config.finalLine}
        </p>

        <div className="bg-helden-photo-gradient relative mt-8 flex-1 overflow-hidden rounded-2xl">
          <img src={existing?.image} alt="" className="size-full object-cover" />
        </div>

        {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}

        {canRetake ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={busy}
            className="text-helden-title mt-6 h-16 w-full rounded-lg bg-white/10 text-lg font-medium disabled:opacity-40"
          >
            {busy ? 'Menyimpan…' : 'Retake'}
          </button>
        ) : (
          <p className="text-helden-body mt-6 text-center text-sm">
            Your memory is on the big screen.
          </p>
        )}
      </div>
    </div>
  )
}
