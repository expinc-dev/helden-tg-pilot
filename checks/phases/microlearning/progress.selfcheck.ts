// Runnable self-check for the microlearning progress maths.
//   npx tsx checks/phases/microlearning/progress.selfcheck.ts
import {
  pickCentralStep,
  roomProgress,
  teamProgress,
} from '../../../src/phases/Microlearning/progress'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}
const eq = (a: unknown, b: unknown, msg: string) => ok(JSON.stringify(a) === JSON.stringify(b), msg)
const P = (id: string, selfStep: number) => ({ id, selfStep })

// ---- central step ---------------------------------------------------------
eq(pickCentralStep({ players: [], total: 3, leaderIds: [] }), 0, 'nobody -> step 0')
eq(
  pickCentralStep({ players: [P('a', 1), P('b', 0)], total: 3, leaderIds: [] }),
  1,
  'tie goes to the LATER step (question stays visible)'
)
eq(
  pickCentralStep({ players: [P('a', 0), P('b', 0), P('c', 1)], total: 3, leaderIds: [] }),
  0,
  'majority wins over a single early finisher'
)
eq(
  pickCentralStep({ players: [P('a', 9)], total: 3, leaderIds: [] }),
  2,
  'step is clamped to the last step'
)
// leader-only: members never write a step, so only leaders count.
eq(
  pickCentralStep({
    players: [P('l1', 1), P('m1', 0), P('m2', 0), P('m3', 0)],
    total: 3,
    teamMode: 'team_leader_only',
    leaderIds: ['l1'],
  }),
  1,
  'leader-only follows the leaders, not the watching members'
)
// leader-only phase in a session without teams -> everyone counts.
eq(
  pickCentralStep({
    players: [P('a', 1), P('b', 1)],
    total: 3,
    teamMode: 'team_leader_only',
    leaderIds: [],
  }),
  1,
  'no teams -> all players'
)

// ---- room progress ----------------------------------------------------------
eq(
  roomProgress({ players: [P('a', 3), P('b', 1)], total: 3, joined: 4, leaderIds: [] }),
  { finished: 1, roomSize: 4 },
  'joined (not only online) is the room'
)
eq(
  roomProgress({
    players: [P('l1', 3), P('l2', 1), P('m', 0)],
    total: 3,
    joined: 6,
    teamMode: 'team_leader_only',
    leaderIds: ['l1', 'l2'],
  }),
  { finished: 1, roomSize: 2 },
  'leader-only: finished leaders / teams'
)

// ---- host team progress -------------------------------------------------------
// individual: one finished leader must not mark the whole team done.
const solo = teamProgress({
  teamMode: 'individual',
  total: 3,
  leaderId: 'l',
  members: [P('l', 3), P('m1', 0), P('m2', 0)],
})
eq(solo.pct, 33, 'team = average of members (100 + 0 + 0) / 3')
eq(
  solo.members.map((m) => m.step),
  [3, 0, 0],
  'members keep their OWN step'
)
// leader-only: team = leader, members are watching (no step).
const lead = teamProgress({
  teamMode: 'team_leader_only',
  total: 3,
  leaderId: 'l',
  members: [P('l', 3), P('m1', 0)],
})
eq(lead.pct, 100, 'leader-only: team progress = leader')
eq(
  lead.members.map((m) => m.step),
  [3, null],
  'leader-only: members are watching'
)
eq(teamProgress({ total: 3, members: [] }).pct, 0, 'empty team is 0%')

console.log('progress.selfcheck: OK')
