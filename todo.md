# Status

Semua item TODO sebelumnya (rich text formatting, `image.title` rendering,
runtime scanner qr_scan/pattern_scan) sudah selesai diimplementasi.

## Yang masih perlu diverifikasi manual (gak bisa dites dari sini)

- **Kalibrasi dHash** (`src/lib/scan/patternHash.ts`, `MATCH_THRESHOLD = 12`)
  — perlu dites di device fisik beneran (kamera HP, lighting real, puzzle
  fisik sungguhan). Guide-box crop di `ScannerPopup` udah nutup gap framing
  (foto mentah dulu ikut background meja/tray, gak pernah match reference
  yang di-crop rapat). Kalau kebanyakan false-positive (pola beda ke-detect
  cocok) → turunin threshold. Kalau kebanyakan false-negative (pola benar
  ditolak) → naikin threshold.
- **`BarcodeDetector` availability** — native di Chrome/Edge/Safari 17+,
  fallback `jsQR` buat browser lain. Belum dites device nyata mana pun.
- **Kamera permission flow** (`ScannerPopup.tsx`) — belum dites behavior
  pas user nolak izin kamera, atau di browser tanpa HTTPS (getUserMedia
  butuh secure context, kecuali localhost).
- **Audio feedback** (`src/lib/scan/feedbackSound.ts`) — chime digenerate via
  Web Audio API (bukan file audio), belum dites apakah kedengeran/pas timing
  di device asli.
