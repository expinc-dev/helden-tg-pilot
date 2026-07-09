import type { Phase, PublishedGame } from '@helden-inc/tg-schema'

// ponytail: in-memory bundle. Move to Firestore load when CMS publish exists (T-cms-publish).
const idle: Phase = {
  id: 'p-idle',
  type: 'idle',
  title: 'Waiting room',
  syncMode: 'lockstep',
  roles: { player: { enabled: true }, central: { enabled: true }, host: { monitor: ['presence'] } },
  content: { type: 'idle', lottieMediaId: 'm-lottie-waiting', caption: 'Welcome' },
}

const intro: Phase = {
  id: 'p-intro',
  type: 'microlearning',
  title: 'Onboarding',
  syncMode: 'self_paced',
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
  roles: { player: { enabled: true }, central: { enabled: true }, host: { monitor: ['progress'] } },
  content: {
    type: 'codeinput',
    expected: 'HELDEN',
    caseSensitive: false,
    maxAttempts: 5,
    onSuccess: { advance: false },
  },
}

export const demoBundle: PublishedGame = {
  id: 'pilot-demo',
  gameId: 'pilot',
  schemaVersion: '1.2.0',
  title: 'Pilot demo',
  phaseOrder: [idle.id, intro.id, puzzle.id],
  phases: { [idle.id]: idle, [intro.id]: intro, [puzzle.id]: puzzle },
  publishedAt: Date.now(),
  publishedBy: 'pilot',
}
