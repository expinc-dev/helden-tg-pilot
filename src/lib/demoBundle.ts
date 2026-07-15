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
  schemaVersion: '2.1.1',
  title: 'Pilot demo',
  // Modular flow: phaseOrder[0] MUST be an idle phase — it's the picker anchor.
  // Non-idle phases become level cards in the Host page control picker.
  flowMode: 'modular',
  phaseOrder: [idle.id, intro.id, video.id, puzzle.id, sortGame.id],
  phases: {
    [idle.id]: idle,
    [intro.id]: intro,
    [video.id]: video,
    [puzzle.id]: puzzle,
    [sortGame.id]: sortGame,
  },
  publishedAt: Date.now(),
  publishedBy: 'pilot',
}
