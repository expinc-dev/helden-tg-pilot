import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { assets } from '@/assets'
import { Header } from '@/pages/host/_shared/Header'
import { Icon } from '@iconify/react'

import { createSession } from '@/lib/session/create'

type GameMode = 'multiplayer' | 'single'

export function HostNew() {
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [mode, setMode] = useState<GameMode>('multiplayer')
  const [name, setName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('')
  const [maxCentralScreens, setMaxCentralScreens] = useState('')
  const [maxMembers, setMaxMembers] = useState('')

  const submit = async () => {
    setBusy(true)
    setErr(null)
    try {
      const { sessionId } = await createSession({
        name,
        maxPlayers: Number(maxPlayers) || undefined,
        maxCentralScreens: Number(maxCentralScreens) || undefined,
        // ponytail: Multiplayer implies team mode; Single Player disables it. Wire real single-player flow later.
        allowTeams: mode === 'multiplayer',
        // Only meaningful when allowTeams; createSession drops it otherwise.
        maxMembers: mode === 'multiplayer' ? Number(maxMembers) || undefined : undefined,
      })
      nav(`/host/${sessionId}`, { replace: true })
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    // <div className="min-h-dvh w-full bg-black bg-cover bg-center p-3 sm:p-6">
    <div
      className="flex h-dvh w-full flex-col justify-between gap-6 overflow-y-auto p-3 sm:p-8"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.auth})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Header />

      <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-white/5 bg-[#121212] p-4 sm:mb-10 sm:gap-5 sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm text-white sm:text-base">Mode Permainan</span>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#1C1C1E] p-1">
            <ModeTab
              icon="mdi:account-group"
              label="Multiplayer"
              active={mode === 'multiplayer'}
              onClick={() => setMode('multiplayer')}
            />
            <ModeTab
              icon="mdi:account"
              label="Single Player"
              active={mode === 'single'}
              onClick={() => setMode('single')}
            />
          </div>
        </div>

        <div className="h-px bg-white/5" />

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
        {mode === 'multiplayer' && (
          <Field
            label="Maksimal Anggota per Tim"
            placeholder="Kosongkan = tanpa batas"
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
    // </div>
  )
}

function ModeTab({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-colors sm:text-base ${
        active
          ? 'border border-[#FFB800] bg-[#FFB800]/10 text-[#FFB800]'
          : 'text-white/50 hover:text-white/80'
      }`}
    >
      <Icon icon={icon} className="size-4" />
      {label}
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
  const numeric = inputMode === 'numeric'
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-white sm:text-base">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(numeric ? e.target.value.replace(/[^0-9]/g, '') : e.target.value)}
        onKeyDown={(e) => {
          if (numeric && (e.key === '-' || e.key === 'e' || e.key === '+')) e.preventDefault()
        }}
        placeholder={placeholder}
        inputMode={inputMode}
        type={numeric ? 'number' : 'text'}
        className="rounded-lg bg-[#1C1C1E] p-4 text-white placeholder:text-[#555]"
        min={numeric ? 0 : undefined}
      />
    </label>
  )
}
