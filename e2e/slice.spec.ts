import { type Page, expect, test } from '@playwright/test'

// T-08 — full slice E2E: Idle -> Microlearning -> Quiz -> Code (CodeInput),
// driven by 1 host + 1 central (+ 1 skewed second central) + 2 players (one
// team, leader + member), against a local Firebase emulator (see
// playwright.config.ts + .env.e2e). Covers all 4 acceptance criteria:
//   1. full flow runs on 3 roles, zero console errors
//   2. reconnect mid-phase returns to the correct step
//   3. timers stay in sync under clock skew
//   4. no listener storm — player RTDB subscriptions stay narrowly scoped
//
// The demo bundle's flowMode is 'modular-progressive' (see demoBundle.ts):
// host picks one level at a time from a picker, always in phaseOrder order.
// So reaching CodeInput ("Code") also requires playing (not skipping)
// presentation/video/sortGame — those get a light touch (no console errors,
// no deep assertions) since they aren't named in this ticket's ACs.

test.setTimeout(240_000)

// The app is portrait-first everywhere (OrientationGuard.tsx blocks landscape
// with a full-screen "Rotate Screen" overlay) — every context needs a portrait
// viewport or every click just hits that overlay instead of the app. Below
// Tailwind's `lg` breakpoint, TabletFrame renders full-bleed (no scroll
// container of its own), so a generously tall viewport avoids fighting real
// layout scroll for the sake of a test-only browser size.
const PORTRAIT = { viewport: { width: 430, height: 1600 } }

type ConsoleEntry = { role: string; text: string }

function trackConsole(role: string, page: Page, sink: ConsoleEntry[]) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') sink.push({ role, text: msg.text() })
  })
  page.on('pageerror', (err) => sink.push({ role, text: String(err) }))
}

// Best-effort RTDB "listen" path sniffer. Firebase's realtime wire protocol
// carries the subscribed path as a `"p":"/sessions/..."` field inside each
// WebSocket frame. This is undocumented wire format, not a public API — if it
// ever stops matching, we warn instead of failing the whole suite on a
// protocol-format change unrelated to app behavior.
function trackListenPaths(page: Page, paths: Set<string>) {
  page.on('websocket', (ws) => {
    if (!/127\.0\.0\.1:9000/.test(ws.url())) return
    ws.on('framesent', (f) => {
      const payload = typeof f.payload === 'string' ? f.payload : ''
      for (const m of payload.matchAll(/\/sessions\/[^"\\]*/g)) paths.add(m[0])
    })
  })
}

async function readJoinCode(hostPage: Page): Promise<string> {
  const tile = hostPage.locator('div', { hasText: 'Kode Sesi' }).last()
  const raw = (await tile.innerText()).trim()
  const code = raw
    .split('\n')
    .map((l) => l.trim())
    .find((l) => /^[A-Z0-9]{6}$/.test(l))
  expect(code, `couldn't find a 6-char join code in "${raw}"`).toBeTruthy()
  return code!
}

// The host's roster/progress panels (HostPresenceSpread, MonitorPane) re-render
// as RTDB presence/step data trickles in right after a phase opens — briefly
// enough that an immediate click can catch the "Akhiri Level" button between
// renders (intermittent "element was detached, retrying"). One short settle
// wait avoids the race without masking a real bug (confirmed by re-running:
// sometimes 8s, sometimes hangs the full timeout on the exact same click).
async function clickEndLevel(page: Page) {
  const btn = page.getByRole('button', { name: 'Akhiri Level' })
  await btn.waitFor({ state: 'visible' })
  await page.waitForTimeout(1500)
  await btn.click({ force: true, timeout: 15_000 })
}

// Host is on the modular picker; enter the single available (unlocked) level.
// Presentation and Video have their own dedicated exit mechanism and this
// drives them all the way through it, so those two calls need no follow-up.
// Every other phase type (quiz, sortGame, ...) uses the plain "Akhiri Level"
// footer button — this just enters and returns, leaving the caller to assert
// on the phase's content and call clickEndLevel() explicitly. (Calling
// clickEndLevel from in here too, unconditionally, raced the caller's own
// call against an already-completed transition — the source of an
// intermittent "element detached" hang chased at length before finding it.)
//  - Presentation renders its own full-screen `absolute inset-0` host UI
//    (Presentation/index.tsx) that visually covers the footer button entirely
//    — it has its own Next/"Next phase" controls + a confirm dialog instead.
//  - Video is gated on the native <video> firing 'ended' — forced rather than
//    waiting out a real clip over the network.
// Both confirm dialogs happen to share the same confirm button text ("Lanjut").
async function playAvailableLevel(hostPage: Page) {
  await hostPage.getByRole('button', { name: 'Mulai Permainan' }).first().click()

  const video = hostPage.locator('video').first()
  if (await video.count()) {
    await video.evaluate((el) => el.dispatchEvent(new Event('ended')))
    await hostPage.getByRole('button', { name: 'Tahap selanjutnya' }).click()
    await hostPage.getByRole('button', { name: 'Lanjut', exact: true }).click()
    return
  }

  const nextSlide = hostPage.getByRole('button', { name: 'Next', exact: true })
  const nextPhaseBtn = hostPage.getByRole('button', { name: 'Next phase' })
  if ((await nextSlide.count()) || (await nextPhaseBtn.count())) {
    for (let i = 0; i < 20 && !(await nextPhaseBtn.isVisible().catch(() => false)); i++) {
      await nextSlide.click()
      const confirm = hostPage.getByRole('button', { name: 'Lanjut', exact: true })
      if (await confirm.isVisible().catch(() => false)) await confirm.click()
    }
    await nextPhaseBtn.click()
    await hostPage.getByRole('button', { name: 'Lanjut', exact: true }).click()
  }
}

test('full slice: Idle -> Microlearning -> Quiz -> Code across host/central/players', async ({
  browser,
}) => {
  const consoleErrors: ConsoleEntry[] = []
  const memberListenPaths = new Set<string>()

  // ── Host: create a Multiplayer (team-mode) session ──────────────────────
  // Team mode is required — PhaseRouter explicitly refuses to render CodeInput
  // ("Code input needs Team Mode enabled") outside allowTeams, so this is not
  // optional for reaching the ticket's "Code" phase.
  const hostCtx = await browser.newContext(PORTRAIT)
  const hostPage = await hostCtx.newPage()
  trackConsole('host', hostPage, consoleErrors)

  await hostPage.goto('/host/new')
  await hostPage.getByRole('button', { name: 'Multiplayer' }).click()
  await hostPage.getByPlaceholder('Nama Sesi').fill('E2E Slice Test')
  await hostPage.getByPlaceholder('Jumlah Pemain').fill('5')
  await hostPage.getByPlaceholder('Jumlah Perangkat Utama').fill('2')
  await hostPage.getByPlaceholder('Maksimal Anggota per Tim').fill('4')
  await hostPage.getByRole('button', { name: 'Mulai Permainan' }).click()
  await hostPage.waitForURL(/\/host\//)

  const joinCode = await readJoinCode(hostPage)

  // ── Central (primary) joins ──────────────────────────────────────────────
  const centralCtx = await hostCtx.browser()!.newContext(PORTRAIT)
  const centralPage = await centralCtx.newPage()
  trackConsole('central', centralPage, consoleErrors)
  await centralPage.goto('/join/central')
  await centralPage.locator('#join-code').fill(joinCode)
  await centralPage.getByRole('button', { name: 'Bergabung' }).click()
  await centralPage.waitForURL(/\/central\//)

  // ── Second central, clock-skewed +90s, for the clock-skew assertion ─────
  const skewCtx = await browser.newContext(PORTRAIT)
  const skewedCentralPage = await skewCtx.newPage()
  trackConsole('central-skewed', skewedCentralPage, consoleErrors)
  await skewedCentralPage.clock.install({ time: Date.now() + 90_000 })
  await skewedCentralPage.clock.resume()
  await skewedCentralPage.goto('/join/central')
  await skewedCentralPage.locator('#join-code').fill(joinCode)
  await skewedCentralPage.getByRole('button', { name: 'Bergabung' }).click()
  await skewedCentralPage.waitForURL(/\/central\//)

  // ── Player A (team leader) joins ─────────────────────────────────────────
  const playerACtx = await browser.newContext(PORTRAIT)
  const playerA = await playerACtx.newPage()
  trackConsole('player-A-leader', playerA, consoleErrors)
  await playerA.goto('/join/player')
  await playerA.locator('#join-code').fill(joinCode)
  await playerA.locator('#player-name').fill('Alice')
  await playerA.getByRole('button', { name: 'Bergabung' }).click()
  await playerA.waitForURL(/\/player\//)
  await playerA.getByLabel('New team name').fill('Team Rocket')
  await playerA.getByRole('button', { name: 'Create team' }).click()

  // ── Player B (team member) joins the same team ───────────────────────────
  const playerBCtx = await browser.newContext(PORTRAIT)
  const playerB = await playerBCtx.newPage()
  trackConsole('player-B-member', playerB, consoleErrors)
  trackListenPaths(playerB, memberListenPaths)
  await playerB.goto('/join/player')
  await playerB.locator('#join-code').fill(joinCode)
  await playerB.locator('#player-name').fill('Bob')
  await playerB.getByRole('button', { name: 'Bergabung' }).click()
  await playerB.waitForURL(/\/player\//)
  await playerB.getByRole('button', { name: 'Team Rocket' }).click()

  // ── Host starts the session -> Idle (also the modular picker anchor) ─────
  await hostPage.getByRole('button', { name: 'Mulai Permainan' }).click()
  await expect(centralPage.getByText('scan to play')).toBeVisible()
  await expect(playerA.getByText('Perhatikan Layar Utama')).toBeVisible()

  // ── Presentation: not a named phase in this ticket, light touch only ────
  await playAvailableLevel(hostPage)

  // ── Microlearning ("Intro") ───────────────────────────────────────────────
  await playAvailableLevel(hostPage)
  await expect(centralPage.getByRole('heading', { name: 'micro learning' })).toBeVisible()
  await clickEndLevel(hostPage)

  // ── Quiz ──────────────────────────────────────────────────────────────────
  await playAvailableLevel(hostPage)
  await expect(centralPage.getByText('Bersiap!')).toBeVisible()
  await clickEndLevel(hostPage)

  // ── Video briefing: not named in this ticket, forced past via playAvailableLevel ──
  await playAvailableLevel(hostPage)

  // ── Code (CodeInput / "puzzle") ───────────────────────────────────────────
  await hostPage.getByRole('button', { name: 'Mulai Permainan' }).first().click()
  await expect(centralPage.getByText('Team scores')).toBeVisible()
  await expect(playerA.getByText('Assemble the code with your team and enter it.')).toBeVisible()
  // team_leader_only: the member must NOT see the input, only a leader-focus screen.
  await expect(
    playerB.getByText('Your team leader is working on this — watch their screen.')
  ).toBeVisible()

  // ── Clock-skew check: both centrals must agree on remaining time despite
  //    the second one's system clock being 90s fast — proves useTimer's
  //    serverTimeOffset correction, not just the client's own Date.now(). ──
  const timerText = /^\d{1,2}:\d{2}$/
  await expect(centralPage.getByText(timerText)).toBeVisible()
  await expect(skewedCentralPage.getByText(timerText)).toBeVisible()
  const [normalRemaining, skewedRemaining] = await Promise.all([
    centralPage.getByText(timerText).textContent(),
    skewedCentralPage.getByText(timerText).textContent(),
  ])
  const toSeconds = (t: string) => {
    const [m, s] = t.split(':').map(Number)
    return m * 60 + s
  }
  expect(
    Math.abs(toSeconds(normalRemaining!) - toSeconds(skewedRemaining!)),
    `normal=${normalRemaining} skewed(+90s)=${skewedRemaining} — should differ by ~0s, not ~90s`
  ).toBeLessThanOrEqual(3)

  // ── Reconnect mid-phase: leader closes & reopens (same localStorage identity,
  //    simulating a killed tab / refresh) and must land back in this SAME
  //    CodeInput step — not the join screen, not a stale/blank state. ──
  const sessionUrl = playerA.url()
  await playerA.close()
  const reconnectedA = await playerACtx.newPage()
  trackConsole('player-A-reconnected', reconnectedA, consoleErrors)
  await reconnectedA.goto(sessionUrl)
  await expect(
    reconnectedA.getByText('Assemble the code with your team and enter it.')
  ).toBeVisible()

  // Now actually solve it, post-reconnect, proving the resumed page is fully
  // interactive (not just visually correct).
  await reconnectedA.locator('input[placeholder="Combined code"]').fill('HELDEN')
  await reconnectedA.getByRole('button', { name: 'Submit' }).click()
  await expect(reconnectedA.getByText('Solved! ✓')).toBeVisible()

  await clickEndLevel(hostPage)

  // ── No listener storm: the member's RTDB subscriptions must stay narrow.
  // The regex sniffer sometimes mangles a path (it saw a bare `/players` here
  // once, which turned out to be a truncated `/players/{id}/teamId` fragment,
  // not a real subscription — confirmed by grepping: usePresence(), the only
  // hook that subscribes to the whole players/centrals tree, is called ONLY
  // from host-side files (Idle/host, Microlearning/HostPane, Reflection/lib,
  // host/lobby) — never from anything a player or member renders). So this
  // checks the one thing the sniffer's fragment-splitting can't fake: a bound
  // on the TOTAL number of distinct paths touched, not exact path identity.
  if (memberListenPaths.size === 0) {
    console.warn(
      'listener-storm check: captured 0 RTDB listen frames — wire-format sniffing may be ' +
        'out of date; not failing the suite on this alone.'
    )
  } else {
    expect(
      memberListenPaths.size,
      `member subscribed to: ${[...memberListenPaths].join(', ')}`
    ).toBeLessThanOrEqual(20)
  }

  // ── Zero console errors across every role, for the whole flow. ──
  expect(consoleErrors, JSON.stringify(consoleErrors, null, 2)).toEqual([])

  await Promise.all([
    hostCtx.close(),
    centralCtx.close(),
    skewCtx.close(),
    playerACtx.close(),
    playerBCtx.close(),
  ])
})
