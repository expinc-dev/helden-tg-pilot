// Runnable self-check for the team_selfie template (HLN-018). Pure functions
// only — the scorer and the gallery layout maths, no React/Firebase/canvas.
//   npx tsx checks/phases/minigames/team_selfie.selfcheck.ts
import {
  BENTO_5,
  BENTO_CAPACITY,
  layoutForCount,
  pageForTick,
  paginate,
} from '../../../src/phases/Minigames/TeamSelfie/grid'
import {
  scoreTeamSelfie,
  selfieKeyId,
  teamSelfieConfigSchema,
} from '../../../src/phases/Minigames/TeamSelfie/score'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}

const JPEG = 'data:image/jpeg;base64,AAAA'
const phaseStartMs = 1_000_000

// ── config schema defaults ────────────────────────────────────────────────
// A CMS bundle authored before maxImagePx/jpegQuality existed must still parse,
// and the defaults must keep the RTDB write comfortably under the 400 KB cap.
{
  const parsed = teamSelfieConfigSchema.safeParse({
    finalLine: 'The Journey We Shared',
    retakeAllowed: true,
  })
  ok(parsed.success, 'minimal config parses (optional fields default)')
  if (parsed.success) {
    ok(parsed.data.maxImagePx === 800, 'maxImagePx defaults to 800')
    ok(parsed.data.jpegQuality === 0.6, 'jpegQuality defaults to 0.6')
    ok(parsed.data.caption === undefined, 'caption stays undefined when omitted')
  }
}

// ── scorer ────────────────────────────────────────────────────────────────
{
  // A closing selfie is participation: a real image means correct + answered.
  const r = scoreTeamSelfie({
    config: { finalLine: 'x', retakeAllowed: true, maxImagePx: 800, jpegQuality: 0.6 },
    answer: JPEG,
    answerSubmittedAt: phaseStartMs + 4000,
    phaseStartMs,
  })
  ok(r.correct === true, 'data-url photo → correct')
  ok(r.answered === true, 'data-url photo → answered')
  ok(r.elapsedMs === 4000, 'elapsed measured from phase start')
}

{
  // Envelope shape (what the player actually writes) must score the same as a
  // bare string, so a future schema change cannot silently zero the score.
  const r = scoreTeamSelfie({
    config: { finalLine: 'x', retakeAllowed: true, maxImagePx: 800, jpegQuality: 0.6 },
    answer: { image: JPEG, createdAt: 123 },
    phaseStartMs,
  })
  ok(r.correct === true, 'envelope { image } → correct')
  ok(r.answered === true, 'envelope { image } → answered')
}

{
  // The shape the player ACTUALLY writes to answers/{phaseId}: a small marker
  // pointing at selfies/{keyId}, not the image itself (storing a ~100 KB data
  // URL twice would double the session payload). If this stops scoring, every
  // flushed team_selfie result silently drops to 0 while the gallery still
  // looks perfect — the failure would only be visible in the final scores.
  const r = scoreTeamSelfie({
    config: { finalLine: 'x', retakeAllowed: true, maxImagePx: 800, jpegQuality: 0.6 },
    answer: { hasPhoto: true, keyId: 't1' },
    answerSubmittedAt: phaseStartMs + 2500,
    phaseStartMs,
  })
  ok(r.correct === true, 'player marker { hasPhoto } → correct')
  ok(r.answered === true, 'player marker { hasPhoto } → answered')
  ok(r.elapsedMs === 2500, 'marker still carries submission time')

  const no = scoreTeamSelfie({
    config: { finalLine: 'x', retakeAllowed: true, maxImagePx: 800, jpegQuality: 0.6 },
    answer: { hasPhoto: false, keyId: 't1' },
    phaseStartMs,
  })
  ok(no.correct === false, 'marker { hasPhoto: false } → not correct')
}

{
  // No photo / garbage → not answered, no points.
  const cfg = { finalLine: 'x', retakeAllowed: true, maxImagePx: 800, jpegQuality: 0.6 }
  for (const bad of [undefined, null, '', 'not-an-image', { image: 'http://x/y.png' }, 42]) {
    const r = scoreTeamSelfie({ config: cfg, answer: bad, phaseStartMs })
    ok(r.correct === false, `non-photo answer (${JSON.stringify(bad)}) → not correct`)
    ok(r.answered === false, `non-photo answer (${JSON.stringify(bad)}) → not answered`)
  }
}

// ── key id ────────────────────────────────────────────────────────────────
// Team mode keys by teamId; solo sessions fall back to the playerId. This must
// match the `selfies` rules, which authorise leader OR player writes.
{
  ok(selfieKeyId('t1', 'p1') === 't1', 'team mode keys by teamId')
  ok(selfieKeyId(undefined, 'p1') === 'p1', 'solo keys by playerId')
  ok(selfieKeyId(undefined, undefined) === '', 'no identity → empty key')
}

// ── bento layout ──────────────────────────────────────────────────────────
// The 5-photo composition is a designed bento, not a uniform grid: 4 columns ×
// 2 rows where the five tiles tile the rectangle exactly, with no holes and no
// overlaps. If this ever regresses the central screen shows a visible gap.
{
  ok(BENTO_5.cols === 4 && BENTO_5.rows === 2, 'bento is a 4×2 grid')
  ok(BENTO_5.tiles.length === BENTO_CAPACITY, 'bento holds 5 tiles')

  const cells: string[] = []
  for (const t of BENTO_5.tiles) {
    for (let c = t.col; c < t.col + t.colSpan; c++) {
      for (let r = t.row; r < t.row + t.rowSpan; r++) cells.push(`${c},${r}`)
    }
  }
  const unique = new Set(cells)
  ok(unique.size === cells.length, 'bento tiles never overlap')
  ok(cells.length === 4 * 2, 'bento covers every cell of the 4×2 rectangle')
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 2; r++) ok(unique.has(`${c},${r}`), `cell ${c},${r} is covered`)
  }
}

// Every count produces exactly that many tiles — a caller that forgets to
// paginate renders every photo instead of silently dropping the overflow.
{
  for (let n = 1; n <= 12; n++) {
    const l = layoutForCount(n)
    ok(l.tiles.length === n, `layoutForCount(${n}) → ${n} tiles`)
    for (const t of l.tiles) {
      ok(t.col + t.colSpan <= l.cols, `count ${n}: tile fits horizontally`)
      ok(t.row + t.rowSpan <= l.rows, `count ${n}: tile fits vertically`)
    }
  }
  ok(layoutForCount(0).tiles.length === 0, 'zero photos → no tiles')
  ok(layoutForCount(5) === BENTO_5, 'five photos → the bento')
  ok(layoutForCount(4).cols === 2 && layoutForCount(4).rows === 2, 'four photos → 2×2')
}

// ── pagination + rotation ─────────────────────────────────────────────────
{
  const pages = paginate([1, 2, 3, 4, 5, 6, 7], 5)
  ok(pages.length === 2, '7 items / 5 per page → 2 pages')
  ok(pages[0].length === 5 && pages[1].length === 2, 'pages split 5 + 2')
  ok(pages.flat().join() === '1,2,3,4,5,6,7', 'pagination preserves order')

  ok(paginate([], 5).length === 1, 'no photos still yields one (empty) page')
  ok(paginate([], 5)[0].length === 0, 'that page is empty')
  ok(paginate([1, 2, 3], 0).length === 3, 'capacity 0 does not divide by zero')
}

{
  ok(pageForTick(0, 3) === 0, 'tick 0 → page 0')
  ok(pageForTick(1, 3) === 1, 'tick 1 → page 1')
  ok(pageForTick(3, 3) === 0, 'tick wraps at pageCount')
  ok(pageForTick(7, 3) === 1, 'tick 7 of 3 pages → 1')
  ok(pageForTick(5, 1) === 0, 'single page never rotates')
  ok(pageForTick(-1, 3) === 2, 'negative tick still lands in range')
}

console.log('team_selfie selfcheck: OK')
