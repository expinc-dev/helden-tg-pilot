# T-08 slice E2E

Full flow Idle → Microlearning → Quiz → Code (CodeInput) across 1 host + 2
centrals (one clock-skewed) + 2 players (one team), against a local Firebase
emulator — never the real project.

## Run

```bash
npm run test:e2e
```

That single command starts the Firebase emulator (auth + database) and the
Vite dev server (in `e2e` mode, reading `.env.e2e`), runs the test, and tears
both down.

## Prerequisites

- Playwright's browser: `npx playwright install chromium` (one-time).
- **JDK 21+** for the Realtime Database emulator. If `java -version` is below
  21, install one without touching the system default:
  - macOS: `brew install openjdk@21`
  - Windows: install a JDK 21 (e.g. Temurin/Oracle) to the default
    `C:\Program Files\Java\jdk-21` location, or set `JDK21_BIN` to wherever
    its `bin` folder actually is.

  `playwright.config.ts` points the emulator subprocess (only) at it via
  `PATH`, picking the path by `process.platform` (override with `JDK21_BIN`
  if yours lives somewhere else on either OS).

## What it proves

- Full slice flow runs on host/central/player with zero console errors.
- Reconnect mid-phase (closing and reopening a page in the same browser
  context, so `localStorage` identity persists) returns to the correct step.
- Timers stay in sync under clock skew (a second central's system clock is
  skewed +90s via `page.clock`).
- No listener storm: a member player's RTDB subscription count stays bounded
  (see the comment above that check in `slice.spec.ts` for why it can't assert
  exact paths — the wire-format sniffer is best-effort).
