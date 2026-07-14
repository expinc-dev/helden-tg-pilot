import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { assets } from '@/assets'
import { Header } from '@/pages/host/_shared/Header'

import { createSession } from '@/lib/session/create'

export function HostNew() {
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('')
  const [maxCentralScreens, setMaxCentralScreens] = useState('')
  const [allowTeams, setAllowTeams] = useState(false)
  const [maxMembers, setMaxMembers] = useState('')

  const submit = async () => {
    setBusy(true)
    setErr(null)
    try {
      const { sessionId } = await createSession({
        name,
        maxPlayers: Number(maxPlayers) || undefined,
        maxCentralScreens: Number(maxCentralScreens) || undefined,
        allowTeams,
        maxMembers: allowTeams ? Number(maxMembers) || undefined : undefined,
      })
      nav(`/host/${sessionId}`, { replace: true })
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    <div className="min-h-dvh w-full bg-black bg-cover bg-center p-3 sm:p-6">
      <div
        className="flex min-h-[calc(100dvh-2rem)] w-full flex-col justify-between gap-6 overflow-y-auto p-3 sm:p-8"
        style={{
          backgroundImage: `url(${assets.images.backgrounds.auth})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'top',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <Header />

        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-white/5 bg-[#121212] p-4 sm:mb-10 sm:gap-5 sm:rounded-3xl sm:p-6">
          <Field label="Nama Sesi" placeholder="Nama Sesi" value={name} onChange={setName} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Jumlah Pemain"
              placeholder="Jumlah Pemain"
              value={maxPlayers}
              onChange={setMaxPlayers}
              inputMode="numeric"
            />
            <Field
              label="Jumlah Perangkat Utama"
              placeholder="Jumlah Perangkat Utama"
              value={maxCentralScreens}
              onChange={setMaxCentralScreens}
              inputMode="numeric"
            />
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-[#1C1C1E] px-4 py-3 text-sm text-white sm:text-base">
            <span className="flex-1">
              Mode Tim
              <span className="mt-0.5 block text-xs font-normal text-white/50">
                Kelompokkan pemain ke dalam tim untuk fase puzzle fisik.
              </span>
            </span>
            <Toggle checked={allowTeams} onChange={setAllowTeams} />
          </label>

          {allowTeams && (
            <Field
              label="Maks. Anggota per Tim"
              placeholder="Kosongkan untuk tanpa batas"
              value={maxMembers}
              onChange={setMaxMembers}
              inputMode="numeric"
            />
          )}

          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="w-full rounded-lg bg-[#FFB800] py-4 text-center text-base font-bold text-black disabled:opacity-50 sm:rounded-lg sm:py-[18px] sm:text-lg"
          >
            {busy ? 'Memulai…' : 'Mulai Permainan'}
          </button>
          {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
        </div>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-[#FFB800]' : 'bg-white/20'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-black transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  inputMode,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  inputMode?: 'numeric'
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-white sm:text-base">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        type={inputMode === 'numeric' ? 'number' : 'text'}
        className="rounded-lg bg-[#1C1C1E] p-4 text-white placeholder:text-[#555]"
        min={inputMode === 'numeric' ? 0 : undefined}
      />
    </label>
  )
}
