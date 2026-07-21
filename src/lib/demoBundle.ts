import { assets } from '@/assets'
import type { Phase, PublishedGame, Question } from '@helden-inc/tg-schema'

import type { ImageSequenceQuestion } from '@/phases/Microlearning/PlayerPane/ImageSequenceQuestion'
import type { OrderQuestion } from '@/phases/Microlearning/PlayerPane/OrderQuestion'

import type { SlideTimerConfig } from './sync/useCentralStepTimer'

// ponytail: in-memory bundle. Move to Firestore load when CMS publish exists (T-cms-publish).
const idle: Phase = {
  id: 'p-idle',
  type: 'idle',
  title: 'Waiting room',
  syncMode: 'lockstep',
  roles: { player: { enabled: true }, central: { enabled: true }, host: { monitor: ['presence'] } },
  content: { type: 'idle', lottieMediaId: 'm-lottie-waiting', caption: 'Welcome' },
}

// Host-controlled slide deck, shown before onboarding (level 1). Slide images
// stay in `blocks`; per-slide display extras (title/details/timer/style) live
// outside the schema in `presentationSlideExtras` below — see that export.
const presentation: Phase = {
  id: 'p-presentation',
  type: 'presentation',
  title: 'Welcome presentation',
  syncMode: 'lockstep',
  roles: { player: { enabled: true }, central: { enabled: true }, host: { monitor: [] } },
  content: {
    type: 'presentation',
    controlledBy: 'host',
    slides: [
      {
        id: 'slide-1',
        blocks: [{ kind: 'image', mediaId: assets.images.presentation.classroomExample }],
      },
      {
        id: 'slide-2',
        blocks: [{ kind: 'image', mediaId: assets.images.presentation.classroomExampleFramed }],
      },
      {
        id: 'slide-3',
        blocks: [{ kind: 'image', mediaId: assets.images.presentation.classroomExample }],
      },
      {
        id: 'slide-4',
        blocks: [{ kind: 'image', mediaId: assets.images.presentation.classroomExampleFramed }],
      },
      {
        id: 'slide-5',
        blocks: [{ kind: 'image', mediaId: assets.images.presentation.classroomExample }],
      },
      {
        id: 'slide-6',
        blocks: [{ kind: 'image', mediaId: assets.images.presentation.classroomExampleFramed }],
      },
      {
        id: 'slide-7',
        blocks: [{ kind: 'image', mediaId: assets.images.presentation.classroomExample }],
      },
      {
        id: 'slide-8',
        blocks: [{ kind: 'image', mediaId: assets.images.presentation.classroomExampleFramed }],
      },
      {
        id: 'slide-9',
        blocks: [{ kind: 'image', mediaId: assets.images.presentation.classroomExample }],
      },
      {
        id: 'slide-10',
        blocks: [{ kind: 'image', mediaId: assets.images.presentation.classroomExampleFramed }],
      },
    ],
  },
}

const intro: Phase = {
  id: 'p-intro',
  type: 'microlearning',
  title: 'micro learning',
  syncMode: 'self_paced',
  durationMin: 5,
  // Demo-only: exercises the team_collaborative path — every team member keeps
  // their own step/pace (only scoring, not stepping, is attributed to the
  // team). team_leader_only is exercised elsewhere; that mode would leave
  // every member but the leader on a passive "watch your leader" screen here,
  // which defeats the point of demoing independent self-paced progress.
  teamMode: 'team_collaborative',
  roles: {
    player: { enabled: true },
    central: { enabled: true, showResults: true },
    host: { monitor: ['progress'] },
  },
  content: {
    type: 'microlearning',
    mode: 'sequential',
    steps: [
      { id: 's1', blocks: [{ kind: 'text', markdown: '# Welcome\nYour first training.' }] },
      { id: 's2', blocks: [{ kind: 'text', markdown: '## Rule 1\nRead each step, tap Next.' }] },
      {
        id: 's3',
        blocks: [
          {
            kind: 'image',
            mediaId: assets.images.presentation.classroomExample,
            caption: 'Contoh suasana kelas',
          },
          { kind: 'text', markdown: '## Rule 2\nHost sees your progress live.' },
        ],
      },
      {
        id: 's4',
        // Demo-only: exercises gate.requireAnswered — Next stays disabled until
        // the question block below is answered.
        gate: { requireAnswered: true },
        blocks: [
          {
            kind: 'question',
            question: {
              qType: 'single_choice',
              prompt: [{ kind: 'text', markdown: 'Siap lanjut ke aturan berikutnya?' }],
              options: [
                { id: 'yes', label: 'Ya, siap!' },
                { id: 'no', label: 'Butuh waktu lagi' },
              ],
            },
          },
        ],
      },
      {
        id: 's4b',
        // Demo-only: exercises multi_choice gating — same requireAnswered rule,
        // just needs at least one option picked (not exactly one).
        gate: { requireAnswered: true },
        blocks: [
          {
            kind: 'question',
            question: {
              qType: 'multi_choice',
              prompt: [{ kind: 'text', markdown: 'Materi apa saja yang menurutmu penting?' }],
              options: [
                { id: 'a', label: 'Aturan kelas' },
                { id: 'b', label: 'Jadwal sesi' },
                { id: 'c', label: 'Kontak host' },
                { id: 'd', label: 'Materi tambahan' },
              ],
            },
          },
        ],
      },
      {
        id: 's4c',
        // Demo-only: exercises open_text gating — Next stays disabled until
        // something is typed.
        gate: { requireAnswered: true },
        blocks: [
          {
            kind: 'question',
            question: {
              qType: 'open_text',
              prompt: [{ kind: 'text', markdown: 'Ada pertanyaan sebelum kita lanjut?' }],
              maxLen: 280,
            },
          },
        ],
      },
      {
        id: 's4d',
        // Demo-only: exercises the 'order' qType — a microlearning-only
        // extension to tg-schema's Question union (see OrderQuestion.tsx),
        // so the object literal is cast at this boundary rather than typed
        // directly. Same drag-to-reorder interaction as the standalone
        // sort_order minigame (Level 6), just embedded as a step here instead
        // of its own phase. Ungraded like every other microlearning question.
        gate: { requireAnswered: true },
        blocks: [
          {
            kind: 'question',
            question: {
              qType: 'order',
              prompt: [{ kind: 'text', markdown: 'Urutkan langkah menulis prompt yang baik.' }],
              items: [
                { id: 'i1', label: 'Set the goal & context' },
                { id: 'i2', label: 'Give an example of the desired format' },
                { id: 'i3', label: 'Ask the AI to generate a draft' },
                { id: 'i4', label: 'Review & refine the result' },
              ],
            } satisfies OrderQuestion as unknown as Question,
          },
        ],
      },
      {
        id: 's4e',
        // Demo-only: exercises the 'image_sequence' qType — another
        // microlearning-only extension (see ImageSequenceQuestion.tsx), same
        // cast-at-the-boundary pattern as 'order' above.
        gate: { requireAnswered: true },
        blocks: [
          {
            kind: 'question',
            question: {
              qType: 'image_sequence',
              prompt: [{ kind: 'text', markdown: 'Seret gambar untuk membuat rangkaian cerita.' }],
              images: [
                { id: 'g1', mediaId: assets.images.games.microlearning.eldercareWalkEvent },
                { id: 'g2', mediaId: assets.images.games.microlearning.eldercareVideoCall },
                { id: 'g3', mediaId: assets.images.games.microlearning.eldercareCompanionship },
                { id: 'g4', mediaId: assets.images.games.microlearning.industrialSafetyTeam },
              ],
            } satisfies ImageSequenceQuestion as unknown as Question,
          },
        ],
      },
      { id: 's5', blocks: [{ kind: 'text', markdown: '## Done\nWait for the next phase.' }] },
    ],
  },
}

// Team-mode physical puzzle: each team assembles a printed code and enters it.
// Only renders as a team page when the session has allowTeams=true.
const puzzle: Phase = {
  id: 'p-puzzle',
  type: 'codeinput',
  title: 'Team puzzle',
  syncMode: 'lockstep',
  durationMin: 3,
  // Codeinput state lives at teams/{teamId}/codeinput — inherently team-scoped.
  // team_leader_only attributes the shared solve to the team once (not once per
  // member), so durable results land in teamResults/{teamId} with the full 146.
  teamMode: 'team_leader_only',
  roles: { player: { enabled: true }, central: { enabled: true }, host: { monitor: ['progress'] } },
  timer: {
    seconds: 120,
    authority: 'server',
    autoAdvanceOnExpire: false,
    visibleTo: ['player', 'central'],
  },
  scoring: {
    mode: 'correctness_and_speed',
    maxPoints: 100,
    speedBonus: { maxBonus: 50, decaySeconds: 120 },
  },
  content: {
    type: 'codeinput',
    expected: 'HELDEN',
    caseSensitive: false,
    maxAttempts: 5,
    onSuccess: { advance: false },
  },
}

const video: Phase = {
  id: 'p-video',
  type: 'video',
  title: 'Video briefing',
  syncMode: 'lockstep',
  durationMin: 10,
  roles: { player: { enabled: true }, central: { enabled: true }, host: { monitor: [] } },
  content: {
    type: 'video',
    mediaId: 'm-video-briefing',
    // ponytail: direct MP4 for pilot; swap to a Vimeo URL to exercise the
    // iframe+postMessage path. Real bundles will resolve via CMS mediaId.
    videoUrl: 'https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4',
    target: ['central'],
    allowPlayerControl: false,
  },
}

// Mini-game phase (BLUEPRINT_runtime §9). team_leader_only so only the leader
// drags; members see TeamFocusLeader (routed at PhaseRouter, plus the template
// itself gates team_collaborative + member the same way).
const sortGame: Phase = {
  id: 'p-sort',
  type: 'minigame',
  title: 'Order the steps',
  syncMode: 'lockstep',
  durationMin: 2,
  teamMode: 'team_leader_only',
  roles: { player: { enabled: true }, central: { enabled: true }, host: { monitor: ['scores'] } },
  timer: {
    seconds: 45,
    authority: 'server',
    autoAdvanceOnExpire: false,
    visibleTo: ['player', 'central'],
  },
  scoring: {
    mode: 'correctness_and_speed',
    maxPoints: 100,
    speedBonus: { maxBonus: 50, decaySeconds: 45 },
  },
  content: {
    type: 'minigame',
    templateId: 'sort_order',
    config: {
      items: [
        { id: 'i1', label: 'Set the goal & context' },
        { id: 'i2', label: 'Give an example of the desired format' },
        { id: 'i3', label: 'Ask the AI to generate a draft' },
        { id: 'i4', label: 'Review & refine the result' },
      ],
      correctOrder: ['i1', 'i2', 'i3', 'i4'],
    },
  },
}

const quiz: Phase = {
  id: 'p-quiz',
  type: 'quiz',
  title: 'Kuis Cepat',
  syncMode: 'lockstep',
  // ponytail: no phase-level timer — quiz manages per-question timers via useQuizStep.startTimer
  timer: undefined,
  scoring: {
    mode: 'correctness_and_speed',
    maxPoints: 1000,
    speedBonus: { maxBonus: 500, decaySeconds: 20 },
  },
  roles: {
    central: { enabled: true, showTimer: true, showResults: true },
    player: { enabled: true, showTimer: true },
    host: { monitor: ['answers', 'scores'] },
  },
  content: {
    type: 'quiz',
    mode: 'central_prompt',
    revealAnswers: true,
    readingTimerSeconds: 7,
    answeringTimerSeconds: 7,
    questions: [
      {
        qType: 'single_choice',
        prompt: [{ kind: 'text', markdown: 'Data rahasia perusahaan sebaiknya...' }],
        options: [
          { id: 'a', label: 'Boleh ditempel ke AI publik asal cepat' },
          { id: 'b', label: 'Jangan ditempel ke AI publik' },
          { id: 'c', label: 'Boleh kalau dihapus setelahnya' },
        ],
      },
      {
        qType: 'single_choice',
        prompt: [{ kind: 'text', markdown: 'Apa langkah pertama dalam membuat prompt yang baik?' }],
        options: [
          { id: 'a', label: 'Langsung tulis pertanyaan panjang' },
          { id: 'b', label: 'Copy paste dari internet' },
          { id: 'c', label: 'Tentukan tujuan dan konteks' },
          { id: 'd', label: 'Gunakan bahasa Inggris saja' },
        ],
      },
      {
        qType: 'single_choice',
        prompt: [{ kind: 'text', markdown: 'Hasil output AI generatif sebaiknya...' }],
        options: [
          { id: 'a', label: 'Langsung dipakai tanpa review' },
          { id: 'b', label: 'Selalu di-review dan divalidasi' },
          { id: 'c', label: 'Dianggap 100% akurat' },
        ],
      },
      {
        qType: 'single_choice',
        prompt: [
          { kind: 'text', markdown: 'Manakah contoh penggunaan AI yang etis di tempat kerja?' },
        ],
        options: [
          { id: 'a', label: 'Membantu menyusun draft dokumen internal' },
          { id: 'b', label: 'Mengupload data klien ke chatbot publik' },
          { id: 'c', label: 'Meng-generate review palsu untuk produk' },
        ],
      },
      {
        qType: 'single_choice',
        prompt: [
          { kind: 'text', markdown: 'Apa keuntungan utama menggunakan AI dalam workflow tim?' },
        ],
        options: [
          { id: 'a', label: 'Menggantikan seluruh anggota tim' },
          { id: 'b', label: 'Membuat keputusan bisnis otomatis' },
          { id: 'c', label: 'Mempercepat tugas repetitif dan ideasi' },
        ],
      },
    ],
  },
}

const reflection: Phase = {
  id: 'p-reflection',
  type: 'reflection',
  title: 'Refleksi',
  syncMode: 'self_paced',
  durationMin: 3,
  scoring: { mode: 'participation', maxPoints: 50 },
  roles: {
    player: { enabled: true },
    central: { enabled: true },
    host: { monitor: ['answers'] },
  },
  content: {
    type: 'reflection',
    prompt: 'Apa satu hal yang akan kamu lakukan berbeda setelah sesi ini?',
    openText: { label: 'Refleksimu', maxLen: 500 },
    scale: {
      label: 'Seberapa percaya diri kamu menerapkannya?',
      min: 1,
      max: 5,
      labels: ['Belum percaya diri', 'Sangat percaya diri'],
    },
  },
}

export const demoBundle: PublishedGame = {
  id: 'pilot-demo',
  gameId: 'pilot',
  schemaVersion: '3.2.0',
  title: 'Pilot demo',
  // Modular flow: phaseOrder[0] MUST be an idle phase — it's the picker anchor.
  // Non-idle phases become level cards in the Host page control picker.
  // 'modular-progressive' locks all cards except the next unplayed one; swap
  // to 'modular-open' to let the trainer jump anywhere at any time.
  flowMode: 'modular-progressive',
  phaseOrder: [
    idle.id,
    presentation.id,
    intro.id,
    quiz.id,
    video.id,
    puzzle.id,
    sortGame.id,
    reflection.id,
  ],
  phases: {
    [idle.id]: idle,
    [presentation.id]: presentation,
    [intro.id]: intro,
    [quiz.id]: quiz,
    [video.id]: video,
    [puzzle.id]: puzzle,
    [sortGame.id]: sortGame,
    [reflection.id]: reflection,
  },
  publishedAt: Date.now(),
  publishedBy: 'pilot',
}

// Presentation-only slide extras, keyed by slide id — outside the schema so the
// visual layout (title/details/timer/style) can change without a schema field.
// See src/phases/Presentation/README.md for the supported combinations.
export type PresentationSlideExtras = {
  title?: string
  details?: { heading: string; body: string }
  timer?: SlideTimerConfig
  style?: 'timer-emphasis' | 'detail-emphasis'
}

export const presentationSlideExtras: Record<string, PresentationSlideExtras> = {
  'slide-1': {},
  'slide-2': {
    title: 'Selamat Datang',
  },
  'slide-3': {
    details: {
      heading: 'Kenapa Sesi Ini Penting',
      body: 'Pelatihan ini membantu tim memahami alur kerja baru sebelum onboarding dimulai.',
    },
  },
  'slide-4': {
    title: 'Aturan Sesi',
    details: {
      heading: 'Ikuti Instruksi Host',
      body: 'Perhatikan layar utama dan ikuti arahan host di setiap fase.',
    },
    timer: { seconds: 30, direction: 'down' },
  },
  'slide-5': {
    timer: { seconds: 15, direction: 'up' },
  },
  'slide-6': {
    title: 'Bersiap',
    timer: { seconds: 20, direction: 'down' },
  },
  'slide-7': {
    title: 'Tim & Kolaborasi',
    details: {
      heading: 'Kerja Sama Tim',
      body: 'Beberapa fase membutuhkan kerja sama dengan anggota tim lain.',
    },
    timer: { seconds: 25, direction: 'down' },
    style: 'detail-emphasis',
  },
  'slide-8': {
    details: {
      heading: 'Waktu Terbatas',
      body: 'Beberapa fase memiliki batas waktu, perhatikan timer di layar.',
    },
    timer: { seconds: 20, direction: 'down' },
  },
  'slide-9': {
    title: 'Skor & Penilaian',
    details: {
      heading: 'Cara Penilaian',
      body: 'Skor dihitung dari ketepatan dan kecepatan menjawab.',
    },
    timer: { seconds: 20, direction: 'down' },
  },
  'slide-10': {
    title: 'Siap Memulai?',
    details: {
      heading: 'Mari Mulai',
      body: 'Tekan lanjut untuk memulai fase onboarding.',
    },
    timer: { seconds: 15, direction: 'down' },
    style: 'detail-emphasis',
  },
}
