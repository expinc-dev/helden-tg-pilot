import { assets } from '@/assets'
import type { Phase, PublishedGame } from '@helden-inc/tg-schema'

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
  title: 'Onboarding',
  syncMode: 'self_paced',
  durationMin: 5,
  // Demo-only: exercises the team_leader_only path (useTeamRole + resolveStepTarget)
  // so it's actually clickable in Team Mode — otherwise nothing in this bundle did.
  teamMode: 'team_leader_only',
  roles: { player: { enabled: true }, host: { monitor: ['progress'] } },
  content: {
    type: 'microlearning',
    mode: 'sequential',
    steps: [
      { id: 's1', blocks: [{ kind: 'text', markdown: '# Welcome\nYour first training.' }] },
      { id: 's2', blocks: [{ kind: 'text', markdown: '## Rule 1\nRead each step, tap Next.' }] },
      {
        id: 's3',
        blocks: [{ kind: 'text', markdown: '## Rule 2\nHost sees your progress live.' }],
      },
      { id: 's4', blocks: [{ kind: 'text', markdown: '## Done\nWait for the next phase.' }] },
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

export const demoBundle: PublishedGame = {
  id: 'pilot-demo',
  gameId: 'pilot',
  schemaVersion: '3.0.0',
  title: 'Pilot demo',
  // Modular flow: phaseOrder[0] MUST be an idle phase — it's the picker anchor.
  // Non-idle phases become level cards in the Host page control picker.
  // 'modular-progressive' locks all cards except the next unplayed one; swap
  // to 'modular-open' to let the trainer jump anywhere at any time.
  flowMode: 'modular-progressive',
  phaseOrder: [idle.id, presentation.id, intro.id, video.id, puzzle.id, sortGame.id],
  phases: {
    [idle.id]: idle,
    [presentation.id]: presentation,
    [intro.id]: intro,
    [video.id]: video,
    [puzzle.id]: puzzle,
    [sortGame.id]: sortGame,
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
