// Runnable self-check for the durable-results router. No test runner:
//   npx tsx src/session/flushAggregate.selfcheck.ts
import type { Phase } from '@helden-inc/tg-schema'

import { type Contribution, aggregateForPhase } from '../../../src/lib/session/flushAggregate'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}

const basePhase: Omit<Phase, 'teamMode'> = {
  id: 'p-1',
  type: 'idle',
  title: 't',
  syncMode: 'lockstep',
  roles: {},
  content: { type: 'idle' },
}

// Individual: per-player passthrough.
const indPhase: Phase = { ...basePhase }
const indOut = aggregateForPhase(indPhase, [
  { playerId: 'p1', score: 10, answers: { q0: 'A' }, completedAt: 100 },
  { playerId: 'p2', score: 20, answers: { q0: 'B' }, completedAt: 200 },
])
ok(indOut.keyBy === 'playerId', 'individual: keyBy playerId')
ok(indOut.results.p1?.score === 10 && indOut.results.p2?.score === 20, 'individual: passthrough')

// team_leader_only: only leader's contribution attributed to team.
const lopPhase: Phase = { ...basePhase, teamMode: 'team_leader_only' }
const contribs: Contribution[] = [
  {
    playerId: 'leader-A',
    teamId: 'team-A',
    isLeader: true,
    score: 100,
    answers: { q0: 'ok' },
    completedAt: 10,
  },
  { playerId: 'member-A', teamId: 'team-A', isLeader: false, score: 999, answers: { q0: 'nope' } }, // dropped
  { playerId: 'leader-B', teamId: 'team-B', isLeader: true, score: 50, completedAt: 20 },
  { playerId: 'orphan', score: 42 }, // no teamId → dropped
]
const lopOut = aggregateForPhase(lopPhase, contribs)
ok(lopOut.keyBy === 'teamId', 'leader_only: keyBy teamId')
ok(
  lopOut.results['team-A']?.score === 100,
  `leader_only: only leader counts (got ${lopOut.results['team-A']?.score})`
)
ok(lopOut.results['team-A']?.answers?.q0 === 'ok', 'leader_only: leader answer wins')
ok(lopOut.results['team-B']?.score === 50, 'leader_only: team B leader')
ok(lopOut.results['orphan'] === undefined, 'leader_only: orphan (no teamId) dropped')

// team_collaborative: contributions summed per team, answers merged.
const collabPhase: Phase = { ...basePhase, teamMode: 'team_collaborative' }
const collabOut = aggregateForPhase(collabPhase, [
  { playerId: 'a', teamId: 'team-X', score: 30, answers: { q0: 'A' }, completedAt: 100 },
  { playerId: 'b', teamId: 'team-X', score: 40, answers: { q1: 'B' }, completedAt: 300 },
  { playerId: 'c', teamId: 'team-X', score: 30, answers: { q2: 'C' }, completedAt: 200 },
  { playerId: 'd', teamId: 'team-Y', score: 10 },
])
ok(collabOut.keyBy === 'teamId', 'collab: keyBy teamId')
ok(
  collabOut.results['team-X']?.score === 100,
  `collab: sum 30+40+30 = 100 (got ${collabOut.results['team-X']?.score})`
)
ok(
  collabOut.results['team-X']?.answers?.q0 === 'A' &&
    collabOut.results['team-X']?.answers?.q1 === 'B' &&
    collabOut.results['team-X']?.answers?.q2 === 'C',
  'collab: answers merged across teammates'
)
ok(collabOut.results['team-X']?.completedAt === 300, 'collab: latest completedAt wins')
ok(collabOut.results['team-Y']?.score === 10, 'collab: single-member team')

// Empty input: valid empty payload, no crash.
const emptyOut = aggregateForPhase(indPhase, [])
ok(emptyOut.keyBy === 'playerId' && Object.keys(emptyOut.results).length === 0, 'empty passthrough')

console.log('flushAggregate.selfcheck: OK')
