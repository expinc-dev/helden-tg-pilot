import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { assets } from '@/assets'

import { resolveJoinCode } from '@/session/join'

import { loadIdentity, loadLastSession } from '@/lib/identity'

import { FullscreenToggle } from './FullscreenToggle'

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
      className="flex min-h-screen items-center justify-center bg-neutral-950 bg-cover bg-center p-8"
      style={{ backgroundImage: `url(${assets.images.backgrounds.lobbyBg})` }}
    >
      <FullscreenToggle />

      <form
        onSubmit={joinByCode}
        className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-white/10 bg-black/40 p-8 backdrop-blur-sm"
      >
        <img src={assets.images.logos.companyLogo} alt="Helden Inc." className="h-10 w-auto" />

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
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center font-mono tracking-widest text-white uppercase placeholder:font-sans placeholder:tracking-normal placeholder:text-white/30 placeholder:normal-case"
          />
        </div>

        <button
          disabled={busy || code.length !== 6}
          className="w-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 py-3 font-semibold text-black transition disabled:opacity-50"
        >
          {busy ? 'Bergabung…' : 'Bergabung'}
        </button>

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

      {err && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-8 backdrop-blur-md">
          <div
            className="w-full max-w-sm overflow-hidden rounded-lg border"
            style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.20)' }}
          >
            <div
              className="flex items-center justify-between gap-4 border-b px-5 py-4"
              style={{ borderColor: '#353535', background: '#181818' }}
            >
              <h2 className="font-semibold text-yellow-400">Ups! Kode Ruangan Salah</h2>
              <button
                type="button"
                onClick={dismissErr}
                aria-label="Close"
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-white/80">{err}</p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={backToLanding}
                  className="flex-1 rounded-lg border py-2.5 text-sm text-white"
                  style={{ borderColor: '#353535', background: '#1B1B1B' }}
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={dismissErr}
                  className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-black"
                  style={{ background: 'linear-gradient(120deg, #FDDB00 14.62%, #FDA400 68.41%)' }}
                >
                  Lanjut
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
