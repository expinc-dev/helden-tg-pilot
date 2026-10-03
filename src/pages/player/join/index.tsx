import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { assets } from '@/assets'
import { GradientButton } from '@/components/GradientButton'
import { InvalidCodeModal } from '@/components/InvalidCodeModal'
import { PlayerAppBar } from '@/components/PlayerAppBar'

import { loadIdentity, loadLastSession } from '@/lib/identity'
import { resolveJoinCode } from '@/lib/session/join'

const FIELD_LABEL = 'text-sm font-medium tracking-[-0.04em] text-white'
const FIELD_INPUT =
  'h-12 w-full rounded-lg border bg-[#1B1B1B] px-4 text-base font-medium tracking-[-0.04em] text-white placeholder:text-[#5D5D5D]'

// Dedicated player join page — Figma "Insert Name Screen": app bar on top, the
// form card pinned to the bottom edge (24px padding, 32px gap, 44px bottom),
// 48px fields and a 48px gold "Mulai" button inside the card. Rendered inside
// TabletFrame (player is a phone-sized role), unlike the central join page
// which owns the whole viewport.
export function PlayerJoin() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  // Prefill from a scanned team-invite QR: ?code=…&team=…
  const teamParam = sp.get('team')
  const [code, setCode] = useState(sp.get('code')?.toUpperCase() ?? '')
  const [name, setName] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const lastSessionId = loadLastSession('player')
  const existing = lastSessionId ? loadIdentity(lastSessionId, 'player') : null

  const rejoin = () => {
    if (!lastSessionId) return
    nav(`/player/${lastSessionId}`, { replace: true })
  }

  const dismissErr = () => setErr(null)

  const joinByCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    const sid = await resolveJoinCode(code)
    if (!sid) {
      setErr('Kode ruangan yang Anda masukkan tidak ditemukan. Periksa kembali dan coba lagi.')
      setBusy(false)
      return
    }
    const params = new URLSearchParams()
    if (name) params.set('name', name)
    if (teamParam) params.set('team', teamParam)
    const q = params.toString() ? `?${params}` : ''
    nav(`/player/${sid}${q}`, { replace: true })
  }

  return (
    <div
      className="relative flex min-h-dvh w-full flex-col bg-[#1E1E1E] bg-cover bg-center"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.player})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <PlayerAppBar />

      <form
        onSubmit={joinByCode}
        className="mt-auto flex w-full flex-col gap-8 border-t px-6 pt-6 pb-11 backdrop-blur-xl"
        style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.20)' }}
      >
        <div className="flex w-full flex-col gap-4">
          <div className="flex w-full flex-col gap-3">
            <label htmlFor="join-code" className={FIELD_LABEL}>
              Kode Ruangan
            </label>
            <input
              id="join-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="00000"
              maxLength={6}
              autoFocus
              className={`${FIELD_INPUT} uppercase placeholder:normal-case`}
              style={{ borderColor: '#353535' }}
            />
          </div>

          <div className="flex w-full flex-col gap-3">
            <label htmlFor="player-name" className={FIELD_LABEL}>
              Nama Player
            </label>
            <input
              id="player-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama pemain"
              className={FIELD_INPUT}
              style={{ borderColor: '#353535' }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <GradientButton disabled={busy || code.length !== 6} className="h-12 w-full text-sm">
            {busy ? 'Bergabung…' : 'Mulai'}
          </GradientButton>

          {existing && (
            <button
              type="button"
              disabled={busy}
              onClick={rejoin}
              className="text-sm text-white/60 underline disabled:opacity-50"
            >
              {`Gabung kembali sebagai ${existing.name ?? 'dirimu'}`}
            </button>
          )}
        </div>
      </form>

      {err && <InvalidCodeModal message={err} onDismiss={dismissErr} />}
    </div>
  )
}
