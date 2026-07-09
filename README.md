# helden-tg-pilot

**Runtime** (klien game) untuk Training Game. Satu codebase React + Vite yang menjalankan tiga peran — **host**, **central** (layar bersama), dan **player** — di atas Firebase Realtime Database (RTDB) untuk state sesi live. Ini konsumen dari kontrak data [`@helden-inc/tg-schema`](../helden-tg-schema).

Repo ini mengurus **live session**: buat sesi, join via kode, presence real-time, dan pointer fase yang menyinkronkan semua device. CMS/authoring & data durable (Firestore) di luar scope repo ini.

## 1. Deskripsi singkat

- **Peran (roles)** — satu app, tiga tampilan yang dipilih lewat URL:
  - **host** membuat & mengontrol sesi (start, next phase, lihat presence).
  - **central** layar bersama (proyektor/TV) yang menampilkan konten untuk semua.
  - **player** device tiap peserta.
- **Sumber kebenaran live = RTDB.** Semua peran berlangganan (`onValue`) node yang sama dan bereaksi. Host menggerakkan `phasePointer`; device lain mengikuti.
- **Konten dari bundle**, bukan Firestore live. Saat ini bundle demo statis (`src/lib/demoBundle.ts`) mengikuti bentuk `PublishedGame` dari schema.
- **Identitas per-device** disimpan di `localStorage` (`src/lib/identity.ts`) supaya refresh tidak membuat node presence baru.

## 2. Cara setup

```bash
npm install
cp .env.example .env      # isi kredensial Firebase (lihat bawah)
npm run dev               # Vite dev server
```

`.env` butuh 7 variabel `VITE_FIREBASE_*` (dari Firebase Console → Project settings):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_DATABASE_URL=        # WAJIB — RTDB tak jalan tanpa ini
```

Skrip lain:

| Perintah         | Fungsi                                        |
| ---------------- | --------------------------------------------- |
| `npm run dev`    | Dev server (hot reload)                       |
| `npm run build`  | `tsc -b` (typecheck) + `vite build` → `dist/` |
| `npm run lint`   | ESLint                                        |
| `npm run format` | Prettier                                      |

## 3. Fungsi & modul krusial

Inti runtime berputar di sekitar `rtdb` (god node #4 di graph). Yang paling penting:

### Sesi & presence — `src/session/`

- **`createSession()`** (`create.ts`) — bikin sesi baru: tulis `meta` (status `lobby`), `config` (maxPlayers/maxCentralScreens + joinCode), dan mapping `joinCodes/{code} → sessionId`. Join code 6-karakter dari `newJoinCode()` (`lib/ids.ts`, alfabet tanpa karakter ambigu).
- **`resolveJoinCode(code)`** (`join.ts`) — tukar kode 6-char jadi `sessionId`, atau `null` kalau invalid.
- **`joinPresence(sessionId, role, id, opts)`** (`presence.ts`) — **fungsi paling kritis join**. Async, mengembalikan `JoinResult` (`{ ok, leave }` atau `{ ok:false, reason:'full' }`):
  1. Baca `config` untuk cap peran.
  2. **`runTransaction`** pada node koleksi menegakkan kapasitas secara atomik — join ke-(N+1) ditolak saat penuh.
  3. Kalau slot didapat, tulis node presence + `onDisconnect()` yang otomatis set `connected=false` saat device putus.
- **`reserveSlot(members, id, max)`** (`capacity.ts`) — aturan kapasitas **murni** (tanpa RTDB) yang dipakai transaction di atas: tolak saat penuh, rejoin tak makan slot, slot disconnected bisa dipakai ulang. Diuji `presence.selfcheck.ts`.
- **`startSession()` / `nextPhase()`** (`control.ts`) — kontrol host: set status `live` + arahkan `phasePointer` ke fase pertama, lalu maju ke fase berikut sesuai `demoBundle.phaseOrder`.

### Sinkronisasi live — `src/sync/` (React hooks, semua `onValue`)

- **`usePhasePointer(sessionId)`** — fase aktif yang dilihat semua peran. Ubah pointer di host → semua device pindah fase.
- **`useSessionMeta` / `useSessionConfig` / `usePresenceCounts`** (`useSession.ts`) — status sesi, konfigurasi, dan hitungan player/central yang **connected**.
- **`useMyStep(sessionId, playerId)`** (`usePlayerStep.ts`) — langkah mandiri seorang player (`selfStep`) untuk fase `self_paced`; kembalikan `[step, write]`.
- **`usePlayerBoard(sessionId)`** — daftar semua player + progress, untuk monitor host.

### Peran & rendering — `src/roles/`, `src/phases/`

- **`App.tsx`** — React Router: `/host/new`, `/host/:sessionId`, `/central/:sessionId`, `/player/:sessionId`, `/join/:role`, plus landing.
- **`HostView` / `CentralView` / `PlayerView`** — satu view per peran; berlangganan hook sync lalu render fase aktif.
- **`PhaseRouter`** (`phases/PhaseRouter.tsx`) — **titik ekspansi utama**. Switch pada `phase.content.type` (discriminated union dari schema) → pilih renderer. Sekarang: `idle`, `microlearning`; sisanya fallback "not renderable yet".

## 4. Cara pakai & mengubah

### Alur pakai (happy path)

1. Host buka `/host/new` → **Create session** → diarahkan ke `/host/{sessionId}`, kode 6-char tampil.
2. Player buka `/join/player`, central buka `/join/central`, masukkan kode → diarahkan ke `/{role}/{sessionId}` dan node presence tertulis.
3. Host **Start session** → semua device pindah ke fase pertama. **Next phase** memajukan pointer; semua ikut.

### Menambah tipe konten fase baru (perubahan paling umum)

1. Pastikan tipe kontennya ada di schema (`@helden-inc/tg-schema`, discriminated union `PhaseContent`). Kalau belum → tambah di repo schema dulu, naikkan `SCHEMA_VERSION`.
2. Buat renderer di `src/phases/<Type>.tsx` (contoh pola: `Microlearning.tsx`, `Idle.tsx`).
3. Tambah `case '<type>'` di `PhaseRouter` yang meneruskan `content` yang sudah dinarrow.
4. State live spesifik-player → pakai/tambah hook di `src/sync/` (jangan tulis RTDB langsung dari komponen).

### Aturan main saat mengubah

- **Bentuk data tidak didefinisikan di sini.** `Phase`, `PhaseContent`, `SessionMeta`, dll. datang dari `@helden-inc/tg-schema`. Butuh bentuk baru → ubah di repo schema.
- **Akses RTDB lewat `src/lib/firebase.ts`** (`rtdb`). Baca live via hook di `src/sync/`; tulis via fungsi di `src/session/`. Komponen jangan panggil `ref()`/`onValue()` langsung.
- **Kapasitas & write kritis pakai transaction** (lihat `presence.ts`). Jangan menulis presence/score dengan `set` polos di path yang punya batasan.
- **Ubah aturan kapasitas → update `capacity.ts` + jalankan self-check:**
  ```bash
  npx tsx src/session/presence.selfcheck.ts   # harus cetak "presence.selfcheck: OK"
  ```
- Verifikasi apa pun: `npm run build` harus hijau sebelum dianggap selesai.

## Team Mode

Mode opsional untuk **puzzle fisik** (sumber daya terbatas: kit/printed stuff) di mana beberapa player membentuk tim untuk memecahkan satu puzzle bersama. Diaktifkan per-sesi lewat `config.allowTeams` (butuh schema ≥ 1.2.0).

### Konsep

- **Struktur FLAT.** Setiap device tetap `players/{playerId}` yang setara — presence + `onDisconnect` pakai mekanik yang sudah ada, tanpa special-casing. Tim adalah **relasi terpisah**, bukan nesting.
- **Node tim:** `sessions/{id}/teams/{teamId}` = `{ ownerPlayerId, memberIds[], teamName?, createdAt, codeinput }`. `memberIds[]` adalah roster otoritatif (owner termasuk) sekaligus **anchor transaction `maxMembers`**. `players/{pid}/teamId` menunjuk balik ke tim.
- **`maxMembers` (opsional, sisi host).** Batas ukuran roster (`memberIds.length`, owner dihitung). Ditolak lewat transaction saat penuh — pola sama persis dengan `maxPlayers`. Member yang disconnect tetap di roster (reconnect tak double-add).
- **Page-specific:** hanya renderer team-aware yang memakai state tim. v1: **`codeinput`**. Page lain jalan normal.

### Alur

1. Host membuat sesi dengan **Allow teams** dicentang, opsional isi **Max members / team** (`HostNew` → `createSession({ allowTeams, maxMembers })`).
2. Player join sesi (kode/QR). Selama status `lobby`, muncul **`TeamLobby`**: buat tim (jadi owner) atau gabung tim dari daftar.
3. Owner masuk **team room**: nama tim, jumlah anggota, dan **QR undangan** (`react-qr-code`) yang meng-encode `/join/player?code={joinCode}&team={teamId}`.
4. Teammate **scan QR pakai kamera HP** (bukan scanner in-app) → `JoinGate` membaca param `code`+`team` → isi nama → join sesi; `joinTeam` menambah `memberIds` via transaction (tolak kalau penuh) + set `player.teamId`.
5. Host **Start** → fase berjalan. Di fase `codeinput`, tiap tim punya input & status `attempts/solved` sendiri (`TeamCodeInput`). Host/central melihat monitor progres semua tim.

### Fungsi kunci (Team Mode)

- **`createTeam` / `joinTeam` / `teamInviteUrl`** (`src/session/teams.ts`) — buat tim (`memberIds:[owner]`, set `player.teamId`); `joinTeam` = **`runTransaction` pada `memberIds`** yang menegakkan `maxMembers` lalu set `player.teamId`, kembalikan `ok`/`full`; bangun URL undangan QR.
- **`addMember(memberIds, id, max)`** (`src/session/teamroster.ts`) — aturan roster **murni** (idempotent, tolak saat penuh) yang dipakai transaction; di-uji `teams.selfcheck.ts`.
- **`useTeams` / `useMyTeamId`** (`src/sync/useTeams.ts`) — daftar tim (roster = `memberIds.length`) dan tim milik player.
- **`TeamLobby`** (`src/roles/player/TeamLobby.tsx`) — gate buat/gabung (tangani "team full") + team room dengan QR; tandai owner.
- **`TeamCodeInput`** (`src/phases/CodeInput.tsx`) — puzzle per tim via `runTransaction` (`attempts`/`solved`, hormati `maxAttempts`) + monitor read-only host/central. Cocok-kode murni di `codecheck.ts`.
- **Gating** di `PhaseRouter`: `allowTeams && content.type === 'codeinput'` → varian tim.

### Menambah page team-aware baru

1. Pastikan tipe kontennya ada di schema. 2. Buat renderer yang membaca/menulis `teams/{teamId}/...`. 3. Tambah `case` di `PhaseRouter` dengan syarat `allowTeams` (+ `teamId` untuk player). 4. Tulis state kritis via transaction, sediakan monitor untuk host/central.

## Catatan

- `demoBundle.ts` adalah bundle statis untuk pilot; pemuatan `PublishedGame` nyata dari Firestore adalah pekerjaan berikutnya. Sudah memuat fase demo `codeinput` (`p-puzzle`, kode `HELDEN`) untuk mencoba Team Mode.
- Skoring per-tim belum ada di v1 (hanya `attempts`/`solved`); tambah `teams/{id}/score` bila perlu.
- Beberapa jalur sengaja disederhanakan untuk skala pilot dan ditandai komentar `ponytail:` (mis. transaction menulis ulang seluruh koleksi, `Date.now()` alih-alih `serverTimestamp()`). Komentar itu menyebut plafon & jalur upgrade-nya.
