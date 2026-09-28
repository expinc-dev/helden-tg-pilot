import { z } from 'zod'

import {
  type Seed,
  type SeedSource,
  type SeedSpec,
  microSeedSpec,
  reflectionSeedSpec,
} from '../../../lib/session/seeds'
import type { CorrectnessSignal, MinigameScorerArgs } from '../types'

// form_to_prompt (HLN-005) — the heart of L4b.
//
// The participant fills a short form about their business, the runtime splices
// those values into an authored prompt template, and the participant copies the
// result into Gemini. There is deliberately NO AI call anywhere in this app:
// the whole feature is string concatenation plus a clipboard write (HLN-005 AC6).
//
// Config-only by design. Which fields a path has, what each one is called,
// which ones come pre-filled from an earlier answer, and the prompt text itself
// all live in `minigame.config` — the ONE part of `phase.content` that survives
// publishing (`publishedGameSchema` is all `z.core.$strip`; see HLN-002's
// Technical Notes). So the four paths below are authorable data, not code, and
// can be revised after a real test without touching the pilot (AC1).
//
// The schema mirrors the CMS's templates/formToPrompt.ts intentionally
// (duplicated, not imported — the CMS must not depend on this repo). Defaults
// must agree between the two copies, otherwise a config saved in the CMS could
// be rejected here.
//
// Split from the renderer so the self-check can run without React/Firebase.

export const SEED_SOURCES = ['L1_seed', 'L2_reflection'] as const
const seedSourceSchema = z.enum(SEED_SOURCES)

// Where a seed's answer actually lives (HLN-002). `source` is the label a field
// refers to; the ids are the authored coordinates of the phase that WROTE that
// answer. Both are needed because the label alone ("L1_seed") says nothing about
// which qId to read, and the coordinates alone would mean every field's
// auto-fill silently depends on knowing that L1 1e's free text is step 2.
//
// microlearning coordinates (stepId + blockIndex) and reflection coordinates
// (the bare phaseId) are separate shapes on purpose: which one applies is
// decided by whether `stepId` is present, and building the wrong qId degrades to
// "the participant sees no seed" rather than an error, so it must be explicit
// here rather than guessed at the call site.
export const formToPromptSeedBindingSchema = z.object({
  source: seedSourceSchema,
  // Shown above this seed's text on the 4a discovery step, e.g. "Yang kamu tulis
  // di awal tadi". Authored because it is participant-facing copy.
  cardLabel: z.string().default(''),
  phaseId: z.string(),
  stepId: z.string().optional(),
  blockIndex: z.number().int().min(0).optional(),
  categoryStepId: z.string().optional(),
  categoryBlockIndex: z.number().int().min(0).optional(),
})
export type FormToPromptSeedBinding = z.infer<typeof formToPromptSeedBindingSchema>

export const formToPromptFieldSchema = z.object({
  // The placeholder name: `{{key}}` in `promptTemplate`. Unique per path.
  key: z.string(),
  label: z.string(),
  // Small italic example under an EMPTY field. Deliberately bland and neutral
  // (storyboard §4b): a good example gets copied and dilutes the point of the
  // exercise, so these show the FORMAT and nothing more.
  placeholderExample: z.string().default(''),
  // Auto-fill from the participant's own earlier answer (HLN-002). A field with
  // a source is NEVER given a "contoh:" hint while the seed resolved — it says
  // "sudah terisi dari jawabanmu tadi" instead, because an example next to a
  // pre-filled field reads as "your answer was wrong".
  seedSource: seedSourceSchema.optional(),
  required: z.boolean().default(true),
})
export type FormToPromptField = z.infer<typeof formToPromptFieldSchema>

export const formToPromptPathSchema = z.object({
  id: z.string(),
  label: z.string(),
  // One line on the 4a chooser explaining what this path does.
  description: z.string().default(''),
  fields: z.array(formToPromptFieldSchema).min(1),
  promptTemplate: z.string(),
})
export type FormToPromptPath = z.infer<typeof formToPromptPathSchema>

export const formToPromptConfigSchema = z.object({
  seeds: z.array(formToPromptSeedBindingSchema).default((): FormToPromptSeedBinding[] => []),
  // 4a bridge between the two seed cards and the path list (storyboard §4a).
  bridge: z.string().default(''),
  // The five steps of 4b, verbatim participant-facing copy. Central shows the
  // same text large (storyboard §4b: "Instruksi langkah + progress").
  instructions: z.string().default(''),
  paths: z.array(formToPromptPathSchema).min(1),
})
export type FormToPromptConfig = z.infer<typeof formToPromptConfigSchema>

// The answer a submitted path leaves behind. Kept here rather than spelled out
// at the writer (lib/session/formToPrompt.ts) so the recap (HLN-014) and the
// writer agree by construction. `prompt` is stored, not recomputed: it is what
// the participant actually pasted into Gemini, and a later template edit must
// not rewrite history in the recap.
export type FormToPromptAnswerValue = {
  pathId: string
  pathLabel: string
  fields: Record<string, string>
  prompt: string
}

// Marked instead of blocked: the participant may copy while a required field is
// still empty (HLN-005 asks for the `[empty]` marker variant). Someone who wants
// to read the whole prompt before deciding what to type is doing the exercise
// right; an empty required field only means the button says so, not that the
// screen refuses.
export const EMPTY_VALUE_MARKER = '[kosong]'

// `{{key}}` with optional inner spaces — an author who types `{{ nama }}` means
// the same thing as `{{nama}}`, and silently leaving a *known* placeholder
// unresolved would be the one failure this feature cannot afford.
const PLACEHOLDER = /\{\{\s*([^{}]*?)\s*\}\}/g

/**
 * Splice field values into an authored prompt template.
 *
 * An unknown placeholder is left exactly as written rather than blanked: the
 * author named something the form does not collect, and showing `{{foo}}` to the
 * participant (plus a console warning for whoever is testing) is a bug report,
 * whereas an empty string is a silently wrong prompt. Missing values for KNOWN
 * fields become `[kosong]` so the participant can see which line needs attention
 * — including before they have typed anything, which is what makes "copy still
 * works with an empty form" safe rather than confusing.
 */
export function assemblePrompt(template: string, values: Record<string, string>): string {
  return template.replace(PLACEHOLDER, (match, rawName: string) => {
    const key = rawName.trim()
    if (!(key in values)) {
      console.warn(`[form_to_prompt] unknown placeholder "${match}" in prompt template`)
      return match
    }
    const value = values[key]?.trim()
    return value ? value : EMPTY_VALUE_MARKER
  })
}

/** Field keys a path marks required that still have no value. */
export function missingRequiredKeys(
  path: FormToPromptPath,
  values: Record<string, string>
): string[] {
  return path.fields.filter((f) => f.required && !(values[f.key] ?? '').trim()).map((f) => f.key)
}

/**
 * Bindings → the specs `useSeeds` reads (HLN-002).
 *
 * The branch that matters: only a binding with BOTH `stepId` and `blockIndex`
 * builds a microlearning qId; anything else is treated as a reflection answer
 * keyed by the bare phase id. Getting this wrong produces no error at runtime —
 * `buildSeeds` just finds nothing — so it is done in one place, and the
 * self-check pins it.
 */
export function seedSpecsFrom(bindings: FormToPromptSeedBinding[]): SeedSpec[] {
  return bindings.map((b) =>
    b.stepId !== undefined && b.blockIndex !== undefined
      ? microSeedSpec({
          phaseId: b.phaseId,
          seedStepId: b.stepId,
          seedBlockIndex: b.blockIndex,
          source: b.source,
          categoryStepId: b.categoryStepId,
          categoryBlockIndex: b.categoryBlockIndex,
        })
      : reflectionSeedSpec(b.phaseId, b.source)
  )
}

/** The seed (with its category label) a field's `seedSource` resolved to. */
export function seedForSource(seeds: Seed[], source: SeedSource | undefined): Seed | undefined {
  if (!source) return undefined
  return seeds.find((s) => s.source === source)
}

export function seedSourceLabel(source: SeedSource): string {
  return source === 'L1_seed'
    ? 'Yang kamu tulis di awal tadi'
    : 'Yang kamu tulis setelah ‘Suara Bu Sari’'
}

// Same contract as every other template: a reflection-shaped activity with no
// single correct answer, so `correct` is always false (no points accrue) and
// `answered` only reports "every required field has something in it". Reading a
// persisted answer means tolerating an older/partial shape, hence the narrowing
// rather than a cast.
export function scoreFormToPrompt(args: MinigameScorerArgs<FormToPromptConfig>): CorrectnessSignal {
  const { config, answer } = args
  if (!answer || typeof answer !== 'object')
    return { correct: false, answered: false, elapsedMs: 0 }
  const { pathId, fields } = answer as { pathId?: unknown; fields?: unknown }
  if (typeof pathId !== 'string' || !fields || typeof fields !== 'object') {
    return { correct: false, answered: false, elapsedMs: 0 }
  }
  const path = config.paths.find((p) => p.id === pathId)
  if (!path) return { correct: false, answered: false, elapsedMs: 0 }
  const values: Record<string, string> = {}
  for (const f of path.fields) {
    const v = (fields as Record<string, unknown>)[f.key]
    values[f.key] = typeof v === 'string' ? v : ''
  }
  return { correct: false, answered: missingRequiredKeys(path, values).length === 0, elapsedMs: 0 }
}

// ---------------------------------------------------------------------------
// Shipped default — the four paths of storyboard §4b, verbatim (Indonesian, as
// spoken to the participant; the CMS stores it as authorable copy either way).
// ---------------------------------------------------------------------------

// L1 "1e — Plant the Seed". The single_choice category and the open_text answer
// sit in DIFFERENT steps, and both are block index 1 of their step (block 0 is
// the text block). Both facts are easy to get wrong by hand and impossible to
// notice, which is exactly why they live in one annotated literal.
const L1_PHASE_ID = '01a0c7b0-666f-77b1-9592-b394036528d1'
const L1_TEXT_STEP_ID = '01a0c93e-4dd3-72b1-8d10-89aa24461e33'
const L1_CATEGORY_STEP_ID = '01a0c93c-3b96-7446-998b-29f6310d7928'

const PATH_A_PROMPT = `Kamu adalah asisten yang membantu pemilik usaha kecil di Indonesia memperkuat tulisan promosi. Bahasamu sederhana, hangat, tidak bertele-tele — seperti ngobrol, bukan seperti buku. Ini usaha saya: Nama: {{nama}}. Produk: {{produk}}. Yang bikin beda: {{beda}}. Pembeli dituju: {{target}}. Tulisan lama: {{lama}}. Tugasmu: bantu saya bikin tulisan promo yang terdengar benar-benar SAYA — bukan seperti toko lain.

Aturan penting: (1) JANGAN langsung bikin tulisan jadi. Mulai dengan satu contoh kasar, lalu tanya: 'bagian mana yang paling kamu, mana yang masih generik?' (2) Pancing saya menambahkan cerita/cara/detail khas yang cuma saya tahu — jangan kamu karang. (3) Kalau saya minta 'bikinin aja semua', TOLAK dengan ramah: 'bagian ini harus dari kamu, karena ini yang bikin usahamu beda — coba ceritakan sedikit.' Tugasmu memancing, bukan menggantikan. (4) Jawab singkat tiap kali. Ini obrolan, bukan ceramah. Mulai sekarang.`

const PATH_B_PROMPT = `Kamu asisten yang membantu pemilik usaha kecil di Indonesia menghemat waktu dengan AI. Bahasamu sederhana, hangat, tidak bertele-tele. Ini usaha saya: Nama: {{nama}}. Pekerjaan paling makan waktu: {{kerja}}. Susahnya: {{kenapa}}. Seberapa sering: {{frekuensi}}. Tugasmu: bantu saya cari cara agar AI meringankan pekerjaan ini — TAPI saya tetap yang pegang kendali.

Aturan penting: (1) JANGAN langsung kasih solusi jadi. Tanya dulu 2-3 pertanyaan untuk paham betul pekerjaan saya. (2) Setelah paham, tunjukkan bagaimana AI bisa bantu — tapi ingatkan bagian mana yang TETAP harus saya putuskan sendiri. (3) Kalau saya minta 'otomatiskan semua', jelaskan dengan ramah kenapa itu bahaya — bagian mana yang kalau diserahkan penuh ke AI bisa merugikan usaha saya. (4) Jawab singkat, langkah per langkah. Mulai sekarang.`

const PATH_C_PROMPT = `Kamu asisten yang membantu pemilik usaha kecil di Indonesia mencari ide baru. Bahasamu sederhana, hangat, tidak bertele-tele. Ini usaha saya: Nama: {{nama}}. Produk: {{produk}}. Yang bikin beda: {{beda}}. Saya lagi buntu soal: {{buntu}}. Tugasmu: bantu saya cari ide yang COCOK dengan usaha saya — bukan ide umum yang bisa dipakai siapa saja.

Aturan penting: (1) JANGAN langsung kasih daftar ide. Tanya dulu beberapa hal supaya idenya nyambung dengan keadaan usaha saya yang sebenarnya. (2) Kasih ide yang memanfaatkan apa yang bikin usaha saya BEDA — bukan ide generik 'bikin diskon'/'posting rutin' yang semua orang tahu. (3) Untuk tiap ide, tanya: 'ini cocok nggak sama kamu? kenapa?' — biar saya yang menilai. (4) Jawab singkat. Maksimal 2-3 ide dulu. Mulai sekarang.`

const PATH_D_PROMPT = `Kamu asisten yang membantu pemilik usaha kecil di Indonesia. Bahasamu sederhana, hangat, tidak bertele-tele. Ini usaha saya: Nama: {{nama}}. Produk: {{produk}}. Pertanyaan saya: {{pertanyaan}}. Tugasmu: bantu jawab dengan langkah KONKRET yang bisa saya coba minggu ini — bukan nasihat umum.

Aturan penting: (1) Kalau pertanyaan saya terlalu umum, tanya balik dulu supaya kamu paham situasi saya sebelum menjawab. (2) Kasih 3 langkah konkret, contoh nyata, untuk minggu ini — bukan teori. (3) Kalau ada bagian yang cuma saya yang bisa putuskan, katakan terus terang & kembalikan ke saya. (4) Jawab singkat, langsung ke inti. Mulai sekarang.`

export const formToPromptDefaultConfig: FormToPromptConfig = {
  seeds: [
    {
      source: 'L1_seed',
      cardLabel: seedSourceLabel('L1_seed'),
      phaseId: L1_PHASE_ID,
      stepId: L1_TEXT_STEP_ID,
      blockIndex: 1,
      categoryStepId: L1_CATEGORY_STEP_ID,
      categoryBlockIndex: 1,
    },
  ],
  bridge:
    'Dua hal ini — yang makan waktumu, dan yang bikin usahamu kamu. Sekarang giliranmu pakai AI untuk usahamu sendiri. Pilih satu yang mau kamu kerjakan hari ini:',
  instructions:
    '1. Isi form singkat tentang usahamu.\n2. Salin prompt yang sudah jadi.\n3. Buka Gemini di tab baru, lalu tempel di sana.\n4. Ngobrol seperti biasa — kamu yang mengarahkan.\n5. Kalau sudah selesai, kembali ke sini dan tekan Kirim.',
  paths: [
    {
      id: 'path-a',
      label: 'Perkuat Suaramu',
      description: 'perbaiki tulisan/promo biar terdengar benar-benar kamu.',
      fields: [
        { key: 'nama', label: 'Nama usaha', placeholderExample: 'Warung Berkah', required: true },
        {
          key: 'produk',
          label: 'Produk yang mau dipromosikan',
          placeholderExample: 'nasi kotak untuk acara',
          required: true,
        },
        {
          key: 'beda',
          label: 'Apa yang bikin usahamu beda',
          placeholderExample: 'porsinya lebih banyak dari yang lain',
          seedSource: 'L2_reflection',
          required: true,
        },
        {
          key: 'target',
          label: 'Siapa pembeli yang kamu tuju',
          placeholderExample: 'ibu-ibu yang mau pesan untuk arisan',
          required: true,
        },
        {
          key: 'lama',
          label: 'Tulisan promo lama (boleh kosong)',
          placeholderExample: 'Terima pesanan nasi kotak, harga bersahabat',
          required: false,
        },
      ],
      promptTemplate: PATH_A_PROMPT,
    },
    {
      id: 'path-b',
      label: 'Selesaikan yang Makan Waktu',
      description: 'ambil satu pekerjaan berulang, minta AI bantu.',
      fields: [
        { key: 'nama', label: 'Nama usaha', placeholderExample: 'Warung Berkah', required: true },
        {
          key: 'kerja',
          label: 'Pekerjaan yang paling makan waktu',
          placeholderExample: 'balas chat yang nanya harga dan ongkir',
          seedSource: 'L1_seed',
          required: true,
        },
        {
          key: 'kenapa',
          label: 'Kenapa itu makan waktu / susahnya di mana',
          placeholderExample: 'harus ketik ulang jawaban yang sama tiap ada yang nanya',
          required: true,
        },
        {
          key: 'frekuensi',
          label: 'Seberapa sering kamu melakukannya',
          placeholderExample: 'tiap hari, puluhan kali',
          required: true,
        },
      ],
      promptTemplate: PATH_B_PROMPT,
    },
    {
      id: 'path-c',
      label: 'Cari Ide Baru',
      description: 'buntu mau ke mana? Ajak AI cari ide untuk usahamu.',
      fields: [
        { key: 'nama', label: 'Nama usaha', placeholderExample: 'Warung Berkah', required: true },
        {
          key: 'produk',
          label: 'Produk/jasa kamu',
          placeholderExample: 'nasi kotak untuk acara',
          required: true,
        },
        {
          key: 'beda',
          label: 'Apa yang bikin usahamu beda',
          placeholderExample: 'porsinya lebih banyak dari yang lain',
          seedSource: 'L2_reflection',
          required: true,
        },
        {
          key: 'buntu',
          label: 'Kamu lagi buntu soal apa?',
          placeholderExample: 'mau nambah menu tapi bingung apa yang cocok',
          required: true,
        },
      ],
      promptTemplate: PATH_C_PROMPT,
    },
    {
      id: 'path-d',
      label: 'Tanya Bebas',
      description:
        'ada satu pertanyaan yang mengganjal soal usahamu? Tanyakan, minta langkah konkret.',
      fields: [
        { key: 'nama', label: 'Nama usaha', placeholderExample: 'Warung Berkah', required: true },
        {
          key: 'produk',
          label: 'Produk/jasa kamu',
          placeholderExample: 'nasi kotak untuk acara',
          required: true,
        },
        {
          key: 'pertanyaan',
          label: 'Satu pertanyaan yang mengganjal soal usahamu',
          placeholderExample: 'gimana caranya biar pelanggan balik lagi?',
          required: true,
        },
      ],
      promptTemplate: PATH_D_PROMPT,
    },
  ],
}
