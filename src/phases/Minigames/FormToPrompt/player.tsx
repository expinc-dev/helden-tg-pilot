import { useMemo, useState } from 'react'

import { PlayerScreenFrame } from '@/components/PlayerScreenFrame'
import type { Phase } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { copyToClipboard } from '@/lib/clipboard'
import { submitFormToPromptAnswer } from '@/lib/session/formToPrompt'
import type { Seed } from '@/lib/session/seeds'
import { useSeeds } from '@/lib/sync/useSeeds'

import { SubmittedPane } from './SubmittedPane'
import {
  type FormToPromptConfig,
  type FormToPromptPath,
  assemblePrompt,
  missingRequiredKeys,
  seedForSource,
  seedSpecsFrom,
} from './score'

// The L4 experience, storyboard §4a + §4b, on the participant's phone.
//
// Two screens in one mount because the storyboard treats them as two steps of
// ONE authorable unit (config.seeds + config.bridge + config.paths), and the
// phase pointer between them would be a host action nobody wants to drive:
//   §4a — the two seeds the participant wrote earlier, then the four paths
//   §4b — the chosen path's form, the assembled prompt, Copy, Gemini
//
// The Gemini hand-off is deliberately OUT of the app: no API key ships to a
// phone, and the point of the exercise is that the participant learns to drive
// a public chatbot themselves. Everything here is string concatenation plus a
// clipboard write (HLN-005 AC6).
//
// Seeds come from useSeeds (HLN-002) reading the participant's OWN seat. No
// bundle is passed, so a seed renders without its category label; that is the
// deliberate trade for never importing an author-editable module into a
// player-facing screen (see useSeeds' bundle argument). `choiceLabel` already
// degrades to `undefined` for exactly this case.
export function FormToPromptPlayer({
  phase,
  sessionId,
  writerId,
  config,
}: {
  phase: Phase
  sessionId: string
  writerId: string
  config: FormToPromptConfig
}) {
  const phaseId = phase.id
  const specs = useMemo(() => seedSpecsFrom(config.seeds), [config.seeds])
  const seeds = useSeeds(sessionId, writerId, specs)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [copiedOnce, setCopiedOnce] = useState(false)

  const selected = selectedId ? config.paths.find((p) => p.id === selectedId) : undefined

  // Values carry across paths by KEY. The four paths deliberately share their
  // opening fields ("Nama usaha", "Produk/jasa kamu"), so re-typing the business
  // name after going back to the chooser would be pure friction — and a
  // participant who only discovered the right path on their second look is
  // exactly who this screen must not punish.
  //
  // A key is only ever auto-filled when it is still empty. A seed listener
  // firing after the participant typed something must not overwrite their own
  // words with the seed they already edited away from.
  const openPath = (path: FormToPromptPath) => {
    setSelectedId(path.id)
    setValues((prev) => {
      const next: Record<string, string> = { ...prev }
      for (const field of path.fields) {
        const current = next[field.key]
        if (current !== undefined && current.trim()) continue
        next[field.key] = seedForSource(seeds, field.seedSource)?.text ?? ''
      }
      return next
    })
  }

  const prompt = selected ? assemblePrompt(selected.promptTemplate, values) : ''
  const missing = selected ? missingRequiredKeys(selected, values) : []

  const submit = async () => {
    if (!selected || busy) return
    setBusy(true)
    try {
      await submitFormToPromptAnswer({
        sessionId,
        writerId,
        phaseId,
        answer: { pathId: selected.id, pathLabel: selected.label, fields: values, prompt },
      })
      setSubmitted(true)
    } finally {
      setBusy(false)
    }
  }

  const copyPrompt = () => {
    setCopiedOnce(true)
    void copyToClipboard(prompt)
  }

  return (
    <>
      {submitted && selected ? (
        <PlayerScreenFrame panelClassName="gap-5 p-4">
          <SubmittedPane pathLabel={selected.label} hasEmptyRequired={missing.length > 0} />
        </PlayerScreenFrame>
      ) : (
        <PlayerScreenFrame
          panelClassName="gap-5 p-4"
          onBack={selected ? () => setSelectedId(null) : undefined}
        >
          {selected ? (
            <FormStep
              path={selected}
              seeds={seeds}
              values={values}
              missing={missing}
              prompt={prompt}
              copiedOnce={copiedOnce}
              busy={busy}
              onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
              onCopy={copyPrompt}
              onSubmit={() => void submit()}
            />
          ) : (
            <ChooserStep config={config} seeds={seeds} onPick={openPath} />
          )}
        </PlayerScreenFrame>
      )}
    </>
  )
}

// §4a — "Ini yang Kamu Bawa Sejauh Ini". Discovery first, choice second: the
// seeds are shown before the paths on purpose, so the participant reads what
// they already said about their business before being asked to pick. Path 1 and
// path 2 are authored to answer those two seeds; nothing enforces that, which
// is the point ("benih mengarahkan tanpa memaksa" — storyboard §4a design note).
function ChooserStep({
  config,
  seeds,
  onPick,
}: {
  config: FormToPromptConfig
  seeds: Seed[]
  onPick: (path: FormToPromptPath) => void
}) {
  return (
    <div className="flex flex-col gap-5 pb-6">
      {seeds.length > 0 && (
        <div className="flex flex-col gap-3">
          {seeds.map((seed) => {
            const binding = config.seeds.find((b) => b.source === seed.source)
            return (
              <div
                key={seed.source}
                className="rounded-xl border border-[#FFB800]/30 bg-[rgba(253,219,0,0.08)] p-4"
              >
                <p className="text-xs text-white/50">
                  {binding?.cardLabel || seed.source}
                  {seed.category ? ` · ${seed.category}` : ''}
                </p>
                <p className="mt-1 text-sm leading-6 text-white/90">“{seed.text}”</p>
              </div>
            )
          })}
          <p className="text-center text-xs text-white/35">
            Benih ini mengarahkan, bukan mengunci. Pilih jalur mana pun.
          </p>
        </div>
      )}

      {config.bridge && <p className="text-sm leading-6 text-white/70">{config.bridge}</p>}

      <div className="flex flex-col gap-2.5">
        {config.paths.map((path, i) => (
          <button
            key={path.id}
            type="button"
            onClick={() => onPick(path)}
            className="flex items-start gap-3 rounded-xl border border-[#353535] p-4 text-left transition hover:border-[#FDDB00]"
          >
            <span className="mt-0.5 text-sm font-bold text-[#FFB800]">{i + 1}</span>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-white">{path.label}</span>
              {path.description && (
                <span className="text-xs leading-5 text-white/50">{path.description}</span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// §4b — the chosen path's form, the live prompt, and the two hand-off buttons.
//
// The prompt is assembled on every keystroke rather than on submit: the
// storyboard wants the participant to see what they are about to send, and a
// wrong-looking prompt is the fastest way for them to notice a wrong field.
function FormStep({
  path,
  seeds,
  values,
  missing,
  prompt,
  copiedOnce,
  busy,
  onChange,
  onCopy,
  onSubmit,
}: {
  path: FormToPromptPath
  seeds: Seed[]
  values: Record<string, string>
  missing: string[]
  prompt: string
  copiedOnce: boolean
  busy: boolean
  onChange: (key: string, value: string) => void
  onCopy: () => void
  onSubmit: () => void
}) {
  const nothingFilled = path.fields.every((f) => !(values[f.key] ?? '').trim())

  return (
    <div className="flex flex-col gap-5 pb-6">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-xl leading-[1.2] font-semibold tracking-[-0.04em] text-white">
          {path.label}
        </h2>
        {path.description && <p className="text-xs leading-5 text-white/50">{path.description}</p>}
      </div>

      <div className="flex flex-col gap-4">
        {path.fields.map((field) => {
          const seed = seedForSource(seeds, field.seedSource)
          return (
            <label key={field.key} className="flex flex-col gap-1.5">
              <span className="text-sm text-white/80">
                {field.label}
                {!field.required && <span className="text-white/35"> (boleh kosong)</span>}
              </span>
              <textarea
                rows={2}
                value={values[field.key] ?? ''}
                placeholder={seed ? undefined : field.placeholderExample}
                onChange={(e) => onChange(field.key, e.target.value)}
                className="resize-none rounded-lg border border-[#353535] bg-[#1C1C1E] px-3 py-2.5 text-sm text-white transition placeholder:text-white/30 placeholder:italic focus:border-[#FDDB00] focus:outline-none"
              />
              {seed && (
                <span className="text-xs text-[#FFB800]/70">
                  sudah terisi dari jawabanmu tadi — edit kalau perlu
                </span>
              )}
            </label>
          )
        })}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-white/50">Prompt kamu (salin ke Gemini):</span>
        {/* Read-only, monospace, scrollable: the participant must be able to see
            the whole thing before sending it, and the full prompt is far taller
            than a phone screen. */}
        <pre className="max-h-56 overflow-y-auto rounded-lg border border-[#353535] bg-black/40 p-3 text-[11px] leading-5 whitespace-pre-wrap text-white/70">
          {prompt}
        </pre>
      </div>

      {nothingFilled && (
        <p className="text-xs text-[#FFB800]/80">Isi dulu info usahamu di atas, baru salin.</p>
      )}
      {!nothingFilled && missing.length > 0 && (
        <p className="text-xs text-white/40">
          Masih ada kolom kosong — di prompt jadi {`'[kosong]'`}. Boleh tetap disalin.
        </p>
      )}

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onCopy}
          className="bg-helden-yellow-gradient flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-center text-sm font-semibold text-black transition hover:opacity-90"
        >
          <Icon icon="mdi:content-copy" className="size-4" />
          {copiedOnce ? 'Salin lagi' : 'Salin prompt'}
        </button>
        <a
          href="https://gemini.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#353535] py-3.5 text-center text-sm font-semibold text-white transition hover:border-[#FDDB00]"
        >
          <Icon icon="mdi:open-in-new" className="size-4" />
          Buka Gemini
        </a>
      </div>

      <p className="text-xs leading-5 text-white/40">
        Tempel prompt di Gemini, lalu ngobrol seperti biasa. Kalau sudah dapat yang kamu cari, tekan
        tombol di bawah.
      </p>

      <button
        type="button"
        disabled={busy}
        onClick={onSubmit}
        className="w-full rounded-lg bg-white/10 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? 'Mengirim…' : 'Selesai — kirim jawabanku'}
      </button>
    </div>
  )
}
