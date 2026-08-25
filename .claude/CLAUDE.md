# Project Context

Repo **tg-pilot**, satu dari tiga subproject di monorepo Helden Training Game (peta lintas-repo: [root CLAUDE.md](../.claude/CLAUDE.md)), disebut "tg-runtime" di blueprint lama. Runtime live-player-facing: satu codebase, 3 role via route (`/host` `/central` `/player`), render Phase dari RTDB live state. Konsumsi tipe dari `@helden-inc/tg-schema` ([helden-tg-schema/.claude/CLAUDE.md](../helden-tg-schema/.claude/CLAUDE.md)). Desain/alasan mendalam: [`../BLUEPRINT_runtime.md`](../BLUEPRINT_runtime.md), [`../TIMER_AUTHORITY.md`](../TIMER_AUTHORITY.md), [`../TEAM_MODE.md`](../TEAM_MODE.md).

# AI Assistant Rules

Kamu adalah AI Assistant tingkat lanjut. Patuhi aturan berikut saat membantu saya di project ini:

1. **SELALU GUNAKAN GRAPHIFY SEBELUM MENJAWAB/NGODING:**
   Jangan menebak arsitektur atau dependensi kode. Gunakan skill/tool Graphify (`/graphify`, `graphify path`, atau `graphify explain`) untuk baca `graphify-out/graph.json` dan `GRAPH_REPORT.md` di repo ini sebelum eksplorasi atau perubahan apa pun — jangan pakai `grep`/`ls`/baca manual duluan. Kalau graphify gagal/kosong, baru fallback ke pencarian biasa, dan bilang bahwa itu gagal. Kalau graph dirasa kurang jelas atau stale, jalankan `/graphify . --update` di repo ini, atau `../graphify-refresh.sh` dari root buat refresh ketiga repo sekaligus (**bukan** `npm run myg` — script itu gak ada di monorepo ini).

2. **PROPOSE PLAN & TUNGGU PERSETUJUAN SEBELUM EKSEKUSI (WAJIB):**
   Karena instruksi saya terkadang abstrak, JANGAN PERNAH langsung mengubah, membuat, atau menghapus file kode. Kalau perlu, pakai command `/grill-with-docs` buat lebih jelas mengambil keputusan.
   - Langkah 1: Buat ringkasan singkat tentang apa yang kamu pahami dari permintaan saya.
   - Langkah 2: Buat daftar langkah-langkah (Action Plan) yang berisi file apa saja yang akan dimodifikasi dan logika apa yang akan diubah.
   - Langkah 3: BERHENTI. Tanya saya apakah rencana tersebut sudah benar.
   - Langkah 4: Baru eksekusi penulisan kode HANYA SETELAH saya memberikan persetujuan (misalnya saya jawab "ok", "lanjut", atau "yes").

3. **UPDATE GRAPH SAAT DIPERLUKAN:**
   Jika kita baru saja melakukan _refactoring_ atau penambahan file/komponen dalam jumlah banyak, kamu bisa meminta saya untuk menjalankan `../graphify-refresh.sh` di terminal, atau kamu bisa menjalankannya sendiri (jika memiliki akses eksekusi terminal) untuk merefresh knowledge graph.

4. **IMPACT ANALYSIS:**
   Sebelum kamu memodifikasi fungsi yang bersifat global atau dipakai ulang (`lib/session/`, `lib/sync/`, registry Phase/minigame), pastikan kamu mengecek apakah perubahan tersebut merusak jalur lain di repo ini, **dan** apakah registry-nya masih lockstep dengan CMS (checklist 5 poin di [root CLAUDE.md](../.claude/CLAUDE.md)).

5. **STRICT STOP CONDITION (NO TESTING):**
   Tugasmu HANYA menulis dan memodifikasi kode. Setelah kamu selesai mengubah file, kamu WAJIB langsung berhenti dan menunggu instruksi saya.
   - SAYA yang bertanggung jawab menjalankan server (seperti `npm run dev`).
   - SAYA yang akan membuka browser dan melakukan visual testing. Cukup kasih instruksi cara test, jangan eksekusi sendiri — ini termasuk `claude-in-chrome` atau browser tool apa pun.
   - JANGAN PERNAH menjalankan perintah terminal untuk preview, server, atau membuka browser. Berhenti bekerja segera setelah kode disimpan! (`npm run build`/`npm run lint`/`*.selfcheck.ts` dari Definisi Selesai tetap boleh dijalankan sebagai verifikasi, itu bukan "preview/server/browser".)

6. **UPADTE GRAPH**
   Setelah selesai dengan tugasmu, konfirmasi dulu untuk update graph via `../graphify-refresh.sh`.

## Apa repo ini

Runtime live-player-facing: satu codebase, 3 role via route (`/host/:sessionId`, `/central/:sessionId`, `/player/:sessionId`). Load bundle `publishedGame` immutable, render fase dari RTDB live state. **Tidak pernah** menulis konten authored — itu wilayah CMS (lihat gap: pipeline publish sungguhan belum konek, [helden-tg-cms/.claude/CLAUDE.md](../helden-tg-cms/.claude/CLAUDE.md)).

## Cara kerja (wajib dipahami sebelum mengubah)

1. **`PhaseRouter`** (`src/phases/PhaseRouter.tsx`) dispatch berdasarkan `phase.content.type` — **bukan** `phase.type` (itu cuma enum, gak menyempitkan `content`). Role player lewat gate tambahan (`PlayerPhaseGate`) yang resolve team role **sekali** sebelum renderer manapun mount, supaya member `team_leader_only` tidak pernah lihat UI input, termasuk setelah reconnect.
2. **Minigame punya registry sendiri** (`src/phases/Minigames/registry.ts`): lookup by `templateId`, config divalidasi ulang lewat Zod schema milik template itu. `templateId` tak terdaftar atau config invalid → fallback `UnknownTemplate`, bukan crash.
3. **Timer authority**: satu `sessions/{id}/timer = { phaseId, endsAt }`, ditulis **sekali** oleh host (`lib/session/control.ts` → `openPhaseTimer`). Semua device baca lewat `useTimer`, yang menghitung `remainingMs = endsAt − (now + serverTimeOffset)`. Jangan pernah bikin `setInterval` jadi sumber kebenaran waktu. Detail: [TIMER_AUTHORITY.md](../TIMER_AUTHORITY.md).
4. **Team mode**: relasi flat — `teams/{teamId}.memberIds` + `players/{id}.teamId` sebagai pointer balik. `joinTeam` pakai transaction (`addMember` di `lib/session/teamroster.ts`) supaya `maxMembers` tidak race saat self-join. Detail: [TEAM_MODE.md](../TEAM_MODE.md).
5. **Identity per-device** (`lib/identity.ts`): device ID disimpan di `localStorage` per role+session supaya refresh tidak dianggap device baru. Ini **sistem terpisah** dari Firebase auth uid (lihat status di bawah) — dua identity yang hidup berdampingan, jangan disatukan tanpa alasan kuat.
6. **Auth gate**: `App.tsx` menahan semua routing sampai `useAuthUid()` resolve; setiap write RTDB diasumsikan digate oleh rules berbasis `auth.uid`.
7. **Dua bundle demo, jangan campur**: `lib/demoBundle.ts` (full, dipakai host+central) dan `lib/demoBundlePlayerSafe.ts` (strip `correctId`/`correctIds`/`codeinput.expected`, **cuma** diimport `pages/player/play/index.tsx`). Mirror strip logic dari `helden-tg-cms/src/pages/Game/projection.ts` — kalau ubah salah satu, cek yang lain. Belum ada code-splitting per role (`App.tsx` semua import statis), jadi ini menghilangkan kunci dari yang DIBACA player, bukan dari JS bundle yang di-download — bukan proteksi kriptografis, cuma menaikkan effort.

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
│  └─ firebase.ts, identity.ts, ids.ts, demoBundle.ts, demoBundlePlayerSafe.ts, useAuthUid.ts
└─ components/ui/
e2e/                            # Playwright + Firebase emulator (auth+database) — satu-satunya tempat rules ada
```

**Konvensi baca/tulis**: baca RTDB cuma lewat hook `lib/sync/`, tulis cuma lewat fungsi `lib/session/`. Jangan baca/tulis RTDB langsung dari komponen.

## Status & known gaps (cek kode, jangan cuma percaya dokumen)

- `TEAM_MODE.md` masih bilang "pilot belum pakai auth", tapi kode saat ini (`App.tsx`, `lib/useAuthUid.ts`) sudah pakai `signInAnonymously()` sungguhan dan routing di-block sampai itu resolve. **Dokumen delivery lama sering stale** — [JIRA_STATUS_REPORT.md](../JIRA_STATUS_REPORT.md) juga sudah dikonfirmasi stale terhadap tree sekarang.
- Rules (`database.rules.json`) cuma ada di `e2e/` untuk emulator testing — belum ketemu `firebase.json`/rules yang dideploy ke project Firebase produksi.
- Path di dokumen delivery lama (`src/session/`, `src/sync/`) sudah pindah ke `src/lib/session/`, `src/lib/sync/` di kode aktual — jangan ikuti path dari dokumen tanpa verifikasi.
- CMS belum benar-benar menulis `publishedGames/{gameVersionId}` ke Firestore — `lib/demoBundle.ts`/`lib/demoBundlePlayerSafe.ts` dipakai sebagai bundle sementara, ditempel manual dari 2 file yang didownload CMS (lihat [helden-tg-cms/.claude/CLAUDE.md](../helden-tg-cms/.claude/CLAUDE.md)).
- Answer-key stripping (Cara kerja #7) cuma efektif kalau ada yang disiplin nambah phase graded baru ke `stripPhase` di kedua sisi (cms `projection.ts` + pilot `demoBundlePlayerSafe.ts`) — gak ada single source of truth, dua implementasi terpisah yang harus manual disinkron.

## Definisi Selesai

- `npm run build` (`typecheck` lalu `vite build`) lolos.
- `npm run lint` lolos.
- Kalau ubah logic murni (roster, timer math, codecheck, strip di `demoBundlePlayerSafe.ts`): tulis/jalankan `npx tsx <file>.selfcheck.ts`, harus print `OK`. **Catatan**: dokumen delivery lama (TIMER_AUTHORITY.md, TEAM_MODE.md) sebut beberapa `*.selfcheck.ts` yang gak ada lagi di tree ini — jangan asumsikan ada, cek dulu (`find src -iname "*.selfcheck.ts"`).
- Nambah `PhaseType`/minigame template baru → registry di sini harus tetap lockstep dengan registry CMS (checklist 5 poin di [root CLAUDE.md](../.claude/CLAUDE.md)).

## Jangan lakukan

- **Jangan** baca/tulis RTDB langsung dari komponen — selalu lewat `lib/sync/` (baca) atau `lib/session/` (tulis).
- **Jangan** bikin `setInterval` jadi sumber kebenaran waktu — selalu lewat `useTimer`/`remainingMs`.
- **Jangan** tulis node `timer` dari role selain host.
- **Jangan** pakai `crypto.randomUUID()` / `crypto.subtle` (secure-context-only, crash di HP via LAN HTTP) — pakai `crypto.getRandomValues` (lihat `lib/ids.ts`).
- **Jangan** jalankan atau buka browser test sendiri — lihat "Wajib sebelum kerja" #2.
