import type { Phase, PublishedGame } from '@helden-inc/tg-schema'

// ponytail: in-memory bundle. Move to Firestore load when CMS publish exists (T-cms-publish).
const idle: Phase = {
  id: 'p-idle',
  type: 'idle',
  title: 'Waiting room',
  syncMode: 'lockstep',
  roles: { player: { enabled: true }, central: { enabled: true }, host: { monitor: ['presence'] } },
  content: { type: 'idle', caption: 'Welcome' },
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
    steps: [{ id: 's1', blocks: [{ kind: 'text', markdown: '# Welcome' }] }],
  },
}

export const demoBundle: PublishedGame = {
  id: 'pilot-demo',
  gameId: 'pilot',
  schemaVersion: '1.0.0',
  title: 'Pilot demo',
  phaseOrder: [idle.id, intro.id],
  phases: { [idle.id]: idle, [intro.id]: intro },
  publishedAt: Date.now(),
  publishedBy: 'pilot',
}
