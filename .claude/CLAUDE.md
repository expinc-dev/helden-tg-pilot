# CLAUDE.md — helden-tg-pilot

Konteks kerja untuk AI agent di repo **tg-pilot** (runtime live-player-facing, disebut "tg-runtime" di blueprint lama). Desain/alasan mendalam: [`../BLUEPRINT_runtime.md`](../BLUEPRINT_runtime.md), [`../TIMER_AUTHORITY.md`](../TIMER_AUTHORITY.md), [`../TEAM_MODE.md`](../TEAM_MODE.md). Kontrak data: [`../helden-tg-schema/.claude/CLAUDE.md`](../helden-tg-schema/.claude/CLAUDE.md). Peta monorepo: [`../.claude/CLAUDE.md`](../.claude/CLAUDE.md).

## Wajib sebelum kerja

1. **Jalankan `/graphify`** (atau graph query tool) dulu untuk memetakan arsitektur file/dependency yang relevan. Jangan pakai `grep`, `ls`, atau eksplorasi file manual sebelum itu. Kalau graphify gagal/kosong, baru fallback ke tool pencarian biasa — dan bilang bahwa itu gagal.
2. **Jangan pakai browser tools** (`claude-in-chrome`, atau browser apa pun) untuk testing app ini. User yang pegang semua manual browser testing. Cukup kasih instruksi cara test, jangan eksekusi sendiri.

## Apa repo ini

Runtime live-player-facing: satu codebase, 3 role via route (`/host/:sessionId`, `/central/:sessionId`, `/player/:sessionId`). Load bundle `publishedGame` immutable, render fase dari RTDB live state. **Tidak pernah** menulis konten authored — itu wilayah CMS (lihat gap: pipeline publish sungguhan belum konek, [helden-tg-cms/.claude/CLAUDE.md](../helden-tg-cms/.claude/CLAUDE.md)).

## Cara kerja (wajib dipahami sebelum mengubah)

1. **`PhaseRouter`** (`src/phases/PhaseRouter.tsx`) dispatch berdasarkan `phase.content.type` — **bukan** `phase.type` (itu cuma enum, gak menyempitkan `content`). Role player lewat gate tambahan (`PlayerPhaseGate`) yang resolve team role **sekali** sebelum renderer manapun mount, supaya member `team_leader_only` tidak pernah lihat UI input, termasuk setelah reconnect.
2. **Minigame punya registry sendiri** (`src/phases/Minigames/registry.ts`): lookup by `templateId`, config divalidasi ulang lewat Zod schema milik template itu. `templateId` tak terdaftar atau config invalid → fallback `UnknownTemplate`, bukan crash.
3. **Timer authority**: satu `sessions/{id}/timer = { phaseId, endsAt }`, ditulis **sekali** oleh host (`lib/session/control.ts` → `openPhaseTimer`). Semua device baca lewat `useTimer`, yang menghitung `remainingMs = endsAt − (now + serverTimeOffset)`. Jangan pernah bikin `setInterval` jadi sumber kebenaran waktu. Detail: [TIMER_AUTHORITY.md](../TIMER_AUTHORITY.md).
4. **Team mode**: relasi flat — `teams/{teamId}.memberIds` + `players/{id}.teamId` sebagai pointer balik. `joinTeam` pakai transaction (`addMember` di `lib/session/teamroster.ts`) supaya `maxMembers` tidak race saat self-join. Detail: [TEAM_MODE.md](../TEAM_MODE.md).
5. **Identity per-device** (`lib/identity.ts`): device ID disimpan di `localStorage` per role+session supaya refresh tidak dianggap device baru. Ini **sistem terpisah** dari Firebase auth uid (lihat status di bawah) — dua identity yang hidup berdampingan, jangan disatukan tanpa alasan kuat.
6. **Auth gate**: `App.tsx` menahan semua routing sampai `useAuthUid()` resolve; setiap write RTDB diasumsikan digate oleh rules berbasis `auth.uid`.

## Struktur (real)

```
src/
├─ App.tsx                      # routing 3 role + auth gate
├─ pages/host|central|player/   # halaman per role
├─ phases/                      # PhaseRouter + renderer per PhaseType (mirror registry CMS)
├─ lib/
│  ├─ session/   # penulis RTDB: create, join, presence, control (timer), teams, scoring flush
│  ├─ sync/      # hook pembaca RTDB: useTimer, useSession, useTeams, dst — read-only
│  ├─ scoring/   # score.ts
│  └─ firebase.ts, identity.ts, ids.ts, demoBundle.ts, useAuthUid.ts
└─ components/ui/
e2e/                            # Playwright + Firebase emulator (auth+database) — satu-satunya tempat rules ada
```

**Konvensi baca/tulis**: baca RTDB cuma lewat hook `lib/sync/`, tulis cuma lewat fungsi `lib/session/`. Jangan baca/tulis RTDB langsung dari komponen.

## Status & known gaps (cek kode, jangan cuma percaya dokumen)

- `TEAM_MODE.md` masih bilang "pilot belum pakai auth", tapi kode saat ini (`App.tsx`, `lib/useAuthUid.ts`) sudah pakai `signInAnonymously()` sungguhan dan routing di-block sampai itu resolve. **Dokumen delivery lama sering stale** — [JIRA_STATUS_REPORT.md](../JIRA_STATUS_REPORT.md) juga sudah dikonfirmasi stale terhadap tree sekarang.
- Rules (`database.rules.json`) cuma ada di `e2e/` untuk emulator testing — belum ketemu `firebase.json`/rules yang dideploy ke project Firebase produksi.
- Path di dokumen delivery lama (`src/session/`, `src/sync/`) sudah pindah ke `src/lib/session/`, `src/lib/sync/` di kode aktual — jangan ikuti path dari dokumen tanpa verifikasi.
- CMS belum benar-benar menulis `publishedGames/{gameVersionId}` ke Firestore — `lib/demoBundle.ts` dipakai sebagai bundle sementara (lihat [helden-tg-cms/.claude/CLAUDE.md](../helden-tg-cms/.claude/CLAUDE.md)).

## Definisi Selesai

- `npm run build` (`typecheck` lalu `vite build`) lolos.
- `npm run lint` lolos.
- Kalau ubah logic murni yang punya file `*.selfcheck.ts` (roster, timer math, codecheck): jalankan `npx tsx <file>.selfcheck.ts`, harus print `OK`.
- Nambah `PhaseType`/minigame template baru → registry di sini harus tetap lockstep dengan registry CMS (checklist 5 poin di [root CLAUDE.md](../.claude/CLAUDE.md)).

## Jangan lakukan

- **Jangan** baca/tulis RTDB langsung dari komponen — selalu lewat `lib/sync/` (baca) atau `lib/session/` (tulis).
- **Jangan** bikin `setInterval` jadi sumber kebenaran waktu — selalu lewat `useTimer`/`remainingMs`.
- **Jangan** tulis node `timer` dari role selain host.
- **Jangan** pakai `crypto.randomUUID()` / `crypto.subtle` (secure-context-only, crash di HP via LAN HTTP) — pakai `crypto.getRandomValues` (lihat `lib/ids.ts`).
- **Jangan** jalankan atau buka browser test sendiri — lihat "Wajib sebelum kerja" #2.
