import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { assets } from '@/assets'
import { GradientButton } from '@/components/GradientButton'
import { InvalidCodeModal } from '@/components/InvalidCodeModal'
import { Header } from '@/pages/host/_shared/Header'

import { loadIdentity, loadLastSession } from '@/lib/identity'
import { resolveJoinCode } from '@/lib/session/join'

// Dedicated player join page — styled per the Helden Inc. lobby design.
// Rendered inside TabletFrame (player is a phone-sized role), unlike the
// central join page which owns the whole viewport.
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

  const backToLanding = () => nav('/')
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
      className="relative flex min-h-screen w-full flex-col bg-neutral-950 bg-cover bg-center p-6"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.player})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <Header isShowLogo={true} />

      <form onSubmit={joinByCode} className="mt-auto flex w-full flex-col gap-4">
        <div
          className="flex w-full flex-col gap-4 rounded-[16px] border p-4"
          style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.20)' }}
        >
          <div className="flex w-full flex-col gap-2">
            <label htmlFor="join-code" className="text-sm text-white/70">
              Kode Ruangan
            </label>
            <input
              id="join-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Masukkan kode ruangan"
              maxLength={6}
              autoFocus
              className="w-full rounded-[8px] border px-4 py-3 font-mono tracking-widest text-white uppercase placeholder:font-sans placeholder:tracking-normal placeholder:text-white/30 placeholder:normal-case"
              style={{ borderColor: '#353535', background: '#1B1B1B' }}
            />
          </div>

          <div className="flex w-full flex-col gap-2">
            <label htmlFor="player-name" className="text-sm text-white/70">
              Nama player
            </label>
            <input
              id="player-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama pemain"
              className="w-full rounded-[8px] border px-4 py-3 text-white placeholder:text-white/30"
              style={{ borderColor: '#353535', background: '#1B1B1B' }}
            />
          </div>
        </div>

        <GradientButton disabled={busy || code.length !== 6} className="w-full py-3">
          {busy ? 'Bergabung…' : 'Bergabung'}
        </GradientButton>

        {existing && (
          <button
            type="button"
            disabled={busy}
            onClick={rejoin}
            className="text-sm text-white/60 underline disabled:opacity-50"
          >
            {`Rejoin as ${existing.name ?? 'yourself'}`}
          </button>
        )}
      </form>

      {err && <InvalidCodeModal message={err} onBack={backToLanding} onDismiss={dismissErr} />}
    </div>
  )
}
