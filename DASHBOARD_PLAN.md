# Dashboard CMS — Dampak ke Pilot (Plan & Checklist)

Konteks: CMS menambah dashboard yang menampilkan metrik **Players** per client, dibaca
langsung dari RTDB client. Arsitektur: **1 deployment pilot == 1 client** — env
`VITE_FIREBASE_DATABASE_URL` tiap deploy menunjuk RTDB milik client itu, sehingga seluruh
isi RTDB deploy tsb = data satu client. Plan sisi CMS: [helden-tg-cms/DASHBOARD_PLAN.md](../helden-tg-cms/DASHBOARD_PLAN.md).

## Model FINAL: RTDB per client, event as path

- 1 deploy pilot = 1 event. `EVENT_ID = demoBundle.gameId` (dari bundle yg di-paste).
- Env `VITE_FIREBASE_DATABASE_URL` = **RTDB client** (`client.databaseUrl`).
- Semua path live-session dinamespace di bawah `events/{EVENT_ID}/` lewat `eref()` di [firebase.ts](src/lib/firebase.ts) — satu RTDB client menampung banyak event tanpa campur.
- [x] `eref()` helper + `EVENT_ID` — [src/lib/firebase.ts](src/lib/firebase.ts)
- [x] Semua `ref(rtdb, X)` → `eref(X)` (33 file)
- [x] `create.ts` `gameVersionId: demoBundle.id` (buang `'pilot-demo'`)
- [x] `database.rules.json` di-nest di bawah `events/$eventId/` (semua guard tetap sama)
- [ ] Deploy `database.rules.json`
- [ ] Ops: `client.databaseUrl` = env RTDB tiap deploy event client tsb
- **Isolasi**: struktural + app-level (build cuma tau EVENT_ID-nya). Bukan kriptografis — cross-event write gak bisa diblok rules dgn anon auth (butuh custom token, di luar scope).

## (lama) Players pakai counter agregat

RTDB rules (benar) hanya kasih `.read` di `sessions/$id/players` per-session — CMS TIDAK bisa
bulk-read `/sessions` buat hitung. Solusi: pilot menaikkan **counter** `/stats/players` via
transaction saat player pertama join, CMS baca satu angka itu. DB tetap boundary client
(1 deploy = 1 RTDB), jadi counter = total player client tsb.

- [x] `presence.joinPresence` bump `/stats/players` (+1 transaction) saat `isNew && role==='player'` — [src/lib/session/presence.ts](src/lib/session/presence.ts)
- [x] Rule `/stats/players` (read `auth!=null`, write validate `=== old+1`) — [database.rules.json](database.rules.json)
- [x] Schema `rtdbStatsSchema` + `SCHEMA_VERSION` 4.0.1 → 4.1.0 (additive) — di `helden-tg-schema`
- [ ] **Deploy `database.rules.json`** ke RTDB (kalau belum, write/read counter ditolak)
- [ ] Session lama (210) tidak terhitung — counter mulai dari join baru. Backfill = script sekali jalan terpisah (opsional)

## Sudah ada (tidak perlu diapa-apakan)

- [x] Player node ditulis ke `sessions/{sessionId}/players/{playerId}` (`PlayerPresence`: `name`, `connected`, `lastSeen`, `joinedAt`, `teamId?`) — [src/lib/session/presence.ts](src/lib/session/presence.ts)
- [x] `signInAnonymously()` real untuk player/host — [src/lib/useAuthUid.ts](src/lib/useAuthUid.ts)
- [x] RTDB dibaca dari env `VITE_FIREBASE_DATABASE_URL` — [src/lib/firebase.ts](src/lib/firebase.ts)
- [x] Session dibuat di RTDB (`sessions/{id}/meta` + `config` + `joinCodes/{code}`) — [src/lib/session/create.ts](src/lib/session/create.ts)

## Prasyarat DEPLOY / OPS (per client) — bukan kode

- [ ] Tiap client = satu deployment pilot terpisah (repo/build/URL sendiri)
- [ ] Set `VITE_FIREBASE_DATABASE_URL` deploy = RTDB milik client itu
- [ ] Pastikan nilainya **sama persis** dengan `client.databaseUrl` di Firestore (yang dibaca CMS) — kalau beda, angka Players di dashboard salah/kosong

## Keamanan RTDB — perlu diberesin (known gap)

- [ ] **`database.rules.json` belum ada** — RTDB praktis terbuka; answer key demo masih readable client-side (lihat root CLAUDE.md "Status & known gaps")
- [ ] Saat menulis rules: pastikan admin CMS (Firebase Auth di project `tg-general`) boleh **read** `sessions/*/players` untuk hitung dashboard, tanpa mengekspos jawaban ke player
- [ ] Deploy rules ke tiap RTDB instance client

## Backlog / kalau kebutuhan berkembang (belum, jangan dikerjakan sekarang)

- [ ] **Players per-event** (bukan cuma per-client): session perlu tau `eventId`-nya
      → tambah `eventId?` di `sessionMetaSchema` (schema) + host terima `eventId` dari URL/param saat mulai
- [ ] **Counter agregat** kalau hitung `sessions/*/players` jadi berat: pilot bump counter via transaction saat player pertama join (sesuai rule monorepo "aggregate via transaction"), CMS baca satu angka
- [ ] Bersihkan/arsip session lama biar hitungan "kumulatif" tetap relevan (TTL / archive)
