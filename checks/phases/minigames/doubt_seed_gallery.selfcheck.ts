// Runnable self-check for the anonymous doubt-seed gallery (HLN-003). Pure
// functions only — labelling, card-id resolution and the reveal rule, no
// React/Firebase.
//   npx tsx checks/phases/minigames/doubt_seed_gallery.selfcheck.ts
import {
  GALLERY_SPOTLIGHT_CAP,
  GENERIC_VERSION_TEXT,
  cardTextIndex,
  galleryEntries,
  galleryLabel,
  pinnedGallery,
  submittedGalleryEntries,
  toggleSpotlight,
} from '../../../src/phases/Minigames/DoubtSeed/gallery'
import type { DoubtSeedConfig } from '../../../src/phases/Minigames/DoubtSeed/score'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}

const config: DoubtSeedConfig = {
  soulCards: [
    { id: 's1', text: 'Resep warisan nenek' },
    { id: 's2', text: 'Tiga generasi' },
    { id: 's3', text: 'Dimasak sepenuh hati' },
  ],
  distractorCards: [
    { id: 'd1', text: 'Harga terjangkau' },
    { id: 'd2', text: 'Pelayanan ramah' },
  ],
  dropZones: 3,
  instructions: 'Susun kartu.',
}

// ── card id resolution ────────────────────────────────────────────────────
// Seeds reach the player as one shuffled pool, so an answer can mix soul and
// distractor ids. Both have to resolve or the gallery shows raw ids.
const index = cardTextIndex(config)
ok(index['s1'] === 'Resep warisan nenek', 'soul card id must resolve to its text')
ok(index['d2'] === 'Pelayanan ramah', 'distractor id must resolve too')
ok(Object.keys(index).length === 5, 'every configured card must be indexed exactly once')

// ── anonymous labelling ───────────────────────────────────────────────────
// Positional by design: the label is the only thing identifying an entry, so
// it must never derive from a team or player name (HLN-003 "No names anywhere").
ok(galleryLabel(0) === 'Tim A', 'first entry must be Tim A')
ok(galleryLabel(1) === 'Tim B', 'second entry must be Tim B')
ok(galleryLabel(25) === 'Tim Z', 'label must keep counting past 26 entries')
ok(
  GENERIC_VERSION_TEXT === GENERIC_VERSION_TEXT.trim() && !GENERIC_VERSION_TEXT.includes('Tim '),
  'the generic version must be plain text carrying no team label'
)

// ── roster ────────────────────────────────────────────────────────────────
// Team mode: the leader's answers node is the submission, and ordering is by
// team creation so Tim A/B/C stay stable across re-renders.
const teams = [
  { id: 't2', ownerPlayerId: 'p2', createdAt: 200 },
  { id: 't1', ownerPlayerId: 'p1', createdAt: 100 },
]
const teamRoster = galleryEntries({ teamMode: 'team_collaborative' }, teams, ['p1', 'p2'])
ok(teamRoster.length === 2, 'one roster row per team')
ok(teamRoster[0].writerId === 'p1', 'teams must be ordered by createdAt ascending')
ok(teamRoster[0].key === 't1', 'key must be the team id for stable React identity')

const soloRoster = galleryEntries({ teamMode: 'solo' }, teams, ['p1', 'p2', 'p3'])
ok(soloRoster.length === 3, 'individual session: one row per player, teams ignored')
ok(
  soloRoster.every((r) => r.key === r.writerId),
  'individual writer is the player themselves'
)

// ── reveal rule ───────────────────────────────────────────────────────────
// Only arrangements with cards on the wall; labels renumber from zero over the
// entries that actually show, so the room never sees a gap labelled "Tim B".
const built = submittedGalleryEntries(
  teamRoster,
  { p1: { value: ['s1', 'd2'] }, p2: undefined },
  cardTextIndex(config)
)
ok(built.length === 1, 'a team with no answer must not occupy a slot')
ok(built[0].label === 'Tim A', 'labels must be contiguous over submitted entries')
ok(
  built[0].cards.join('|') === 'Resep warisan nenek|Pelayanan ramah',
  'cards must resolve id -> text in submitted order'
)

// An id the current config no longer has degrades to the raw id rather than
// disappearing — a mid-session config edit must not blank a team's version.
const stale = submittedGalleryEntries(
  teamRoster,
  { p1: { value: ['s1', 'gone'] } },
  cardTextIndex(config)
)
ok(stale[0].cards[1] === 'gone', 'unknown card id must fall back to the raw id')

// Empty / malformed payloads: the gallery stays empty instead of throwing.
ok(submittedGalleryEntries([], {}, {}).length === 0, 'empty roster -> empty gallery')
ok(
  submittedGalleryEntries(teamRoster, { p1: { value: [] } }, {}).length === 0,
  'an empty card list is not a submission'
)
ok(
  submittedGalleryEntries(teamRoster, { p1: undefined, p2: undefined }, index).length === 0,
  'no answers at all -> empty gallery'
)

// ── host curation (HLN-003) ───────────────────────────────────────────────
// Pinning is pure list maths, so the cap and the ordering are checked here
// rather than through the host screen.
const empty: string[] = []
const one = toggleSpotlight(empty, 't1')
ok(one.join(',') === 't1', 'pinning adds the key')
ok(empty.length === 0, 'toggle must not mutate the list it was given')
ok(toggleSpotlight(one, 't1').length === 0, 'toggling a pinned key unpins it')

// Pin order is the host's order, not submission order — that is the whole
// point of curating a pair ("these two contrast the most").
ok(toggleSpotlight(['t2'], 't1').join(',') === 't2,t1', 'a new pin appends, keeping pin order')

// At the cap an add is refused and the room keeps the frame it is watching.
const full = ['a', 'b', 'c']
ok(toggleSpotlight(full, 'd').join(',') === 'a,b,c', 'the cap refuses a further pin')
ok(toggleSpotlight(full, 'b').length === 2, 'unpinning is allowed while at the cap')
ok(toggleSpotlight(['a'], 'b', 1).join(',') === 'a', 'an explicit lower cap is respected')
ok(GALLERY_SPOTLIGHT_CAP === 3, 'the default cap matches the storyboard’s 2–3 versions')

// The pinned subset must keep the wall's own labels: renumbering on pin would
// lose the label the host has just read out to the room.
const wall = submittedGalleryEntries(
  teamRoster,
  { p1: { value: ['s1'] }, p2: { value: ['d1'] } },
  index
)
ok(wall.length === 2, 'both submitted versions are on the wall')
ok(
  wall[0].key === 't1' && wall[0].label === 'Tim A',
  'a card entry keeps the entry key it came from'
)

const pinned = pinnedGallery(wall, ['t2', 't1', 't3'])
ok(pinned.length === 2, 'a pinned key that resolves to nothing is dropped, not rendered')
ok(pinned[0].key === 't2' && pinned[1].key === 't1', 'pinned order follows the pin list')
ok(
  pinned[0].label === 'Tim B' && pinned[1].label === 'Tim A',
  'pinned entries keep their original positional labels'
)
ok(pinnedGallery(wall, []).length === 0, 'nothing pinned -> empty subset')

console.log('doubt_seed_gallery.selfcheck: OK')
