import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { assets } from '@/assets'
import { FullscreenToggle } from '@/components/FullscreenToggle'
import { GradientButton } from '@/components/GradientButton'
import { HeldenLogoLotties } from '@/components/HeldenLogoLotties'
import { InvalidCodeModal } from '@/components/InvalidCodeModal'

import { loadIdentity, loadLastSession } from '@/lib/identity'
import { resolveJoinCode } from '@/lib/session/join'

// Dedicated central-screen join page — styled per the Helden Inc. lobby design.
export function CentralJoin() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const [code, setCode] = useState(sp.get('code')?.toUpperCase() ?? '')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const lastSessionId = loadLastSession('central')
  const existing = lastSessionId ? loadIdentity(lastSessionId, 'central') : null

  const rejoin = () => {
    if (!lastSessionId) return
    nav(`/central/${lastSessionId}`, { replace: true })
  }

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
    nav(`/central/${sid}`, { replace: true })
  }

  const backToLanding = () => nav('/')
  const dismissErr = () => setErr(null)

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center bg-neutral-950 bg-cover bg-center p-8"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.central})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <FullscreenToggle />

      <form
        onSubmit={joinByCode}
        className="flex w-full max-w-lg flex-col items-center gap-6 rounded-[16px] border border-white/10 bg-black/40 p-8 backdrop-blur-sm sm:p-10"
      >
        <HeldenLogoLotties className="h-32 w-auto" />

        <div className="flex w-full flex-col gap-3">
          <div className="flex w-full flex-col gap-2">
            <label htmlFor="join-code" className="text-sm text-white/70">
              Kode Ruangan
            </label>
            <input
              id="join-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Nama Sesi"
              maxLength={6}
              autoFocus
              className="w-full rounded-[8px] border border-white/10 bg-white/5 px-4 py-3 text-center font-mono tracking-widest text-white uppercase placeholder:font-sans placeholder:tracking-normal placeholder:text-white/30 placeholder:normal-case"
            />
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
        </div>
      </form>

      {err && <InvalidCodeModal message={err} onBack={backToLanding} onDismiss={dismissErr} />}
    </div>
  )
}
