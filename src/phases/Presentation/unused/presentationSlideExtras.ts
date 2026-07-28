import type { SlideTimerConfig } from '@/lib/sync/useCentralStepTimer'

// Archived alongside SlideSurface.tsx and layouts/ — the cinematic single-image
// renderer these extras drove was replaced by a stacked block-list renderer
// (see Presentation/index.tsx), so this data has no live consumer anymore.
export type PresentationSlideExtras = {
  title?: string
  details?: { heading: string; body: string }
  timer?: SlideTimerConfig
  style?: 'timer-emphasis' | 'detail-emphasis'
}

export const presentationSlideExtras: Record<string, PresentationSlideExtras> = {
  'slide-1': {},
  'slide-2': {
    title: 'Selamat Datang',
  },
  'slide-3': {
    details: {
      heading: 'Kenapa Sesi Ini Penting',
      body: 'Pelatihan ini membantu tim memahami alur kerja baru sebelum onboarding dimulai.',
    },
  },
  'slide-4': {
    title: 'Aturan Sesi',
    details: {
      heading: 'Ikuti Instruksi Host',
      body: 'Perhatikan layar utama dan ikuti arahan host di setiap fase.',
    },
    timer: { seconds: 30, direction: 'down' },
  },
  'slide-5': {
    timer: { seconds: 15, direction: 'up' },
  },
  'slide-6': {
    title: 'Bersiap',
    timer: { seconds: 20, direction: 'down' },
  },
  'slide-7': {
    title: 'Tim & Kolaborasi',
    details: {
      heading: 'Kerja Sama Tim',
      body: 'Beberapa fase membutuhkan kerja sama dengan anggota tim lain.',
    },
    timer: { seconds: 25, direction: 'down' },
    style: 'detail-emphasis',
  },
  'slide-8': {
    details: {
      heading: 'Waktu Terbatas',
      body: 'Beberapa fase memiliki batas waktu, perhatikan timer di layar.',
    },
    timer: { seconds: 20, direction: 'down' },
  },
  'slide-9': {
    title: 'Skor & Penilaian',
    details: {
      heading: 'Cara Penilaian',
      body: 'Skor dihitung dari ketepatan dan kecepatan menjawab.',
    },
    timer: { seconds: 20, direction: 'down' },
  },
  'slide-10': {
    title: 'Siap Memulai?',
    details: {
      heading: 'Mari Mulai',
      body: 'Tekan lanjut untuk memulai fase onboarding.',
    },
    timer: { seconds: 15, direction: 'down' },
    style: 'detail-emphasis',
  },
}
