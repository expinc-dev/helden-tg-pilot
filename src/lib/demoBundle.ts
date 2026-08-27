import type { PublishedGame } from '@helden-inc/tg-schema'

export const demoBundle: PublishedGame = {
  id: '01a04286-471d-701e-9833-4a4f9a930782',
  gameId: '019f8845-5b6f-70bd-97fe-a4ec6f8c5f2d',
  schemaVersion: '3.9.0',
  title: 'Sowan Tembok Ratapan',
  phaseOrder: ['019f8a7c-9d57-739d-bd80-490fc346d76c', '019f8a5b-da92-77e8-a608-7b2ffea1aff9'],
  flowMode: 'modular-progressive',
  phases: {
    '019f8a7c-9d57-739d-bd80-490fc346d76c': {
      id: '019f8a7c-9d57-739d-bd80-490fc346d76c',
      type: 'microlearning',
      title: 'Phase 3',
      syncMode: 'self_paced',
      roles: {
        player: {
          enabled: true,
        },
        central: {
          enabled: true,
          showResults: true,
        },
        host: {
          monitor: ['progress'],
        },
      },
      scoring: {
        mode: 'none',
      },
      content: {
        type: 'microlearning',
        mode: 'sequential',
        steps: [
          {
            id: '019f8da0-bb85-74c9-846b-f04b690dae72',
            blocks: [
              {
                kind: 'image',
                mediaId: '01a0422d-ebe4-709e-93a8-a872160402fc',
                url: 'https://expinc-cdn.azureedge.net/lexibe/1787816700786-Asset%20-%201.webp',
                title: 'Cari & Susun Balok',
                caption:
                  '- Cari dan ambil balok fisik yang telah disediakan di area permainan.\n- Perhatikan layar untuk melihat pola target yang harus kamu buat.\n- Susun balok satu per satu hingga membentuk pola yang sama seperti yang ditampilkan di layar. Pastikan posisi dan susunan balok sudah sesuai sebelum melanjutkan ke tahap berikutnya.',
              },
              {
                kind: 'image',
                mediaId: '01a04232-0944-750c-b8fd-72632b045bcb',
                url: 'https://expinc-cdn.azureedge.net/lexibe/1787816970430-Asset%20-%202.webp',
                title: 'Pindai Hasil Susunan',
                caption:
                  '- Setelah selesai menyusun, klik tombol Buka Kamera Pemindai.\n- Arahkan kamera ke susunan balok yang telah kamu buat.\n- Sistem akan memindai dan membandingkan susunanmu dengan pola target.',
              },
              {
                kind: 'image',
                mediaId: '01a04232-25d2-72a2-ab57-26420b993a40',
                url: 'https://expinc-cdn.azureedge.net/lexibe/1787816977718-Asset%20-%203.webp',
                title: 'Kumpulkan Poin',
                caption:
                  '- Jika susunanmu sesuai dengan pola target, kamu akan mendapatkan poin tambahan.\n- Jika susunanmu belum sesuai, poinmu akan berkurang.\n- Kamu akan mendapatkan kesempatan untuk memperbaiki susunan dan melakukan submission ulang.',
              },
              {
                kind: 'question',
                question: {
                  qType: 'pattern_scan',
                  prompt: [
                    {
                      kind: 'text',
                      markdown:
                        '# Level 2: Teka-Teki\nPelajari cara merakit balok kinetik agar sesuai dengan pola target dibawah.',
                    },
                  ],
                  targetMediaId: '01a04248-fc11-710f-894f-357752726039',
                  points: {
                    correct: 10,
                    wrongPenalty: 10,
                  },
                },
              },
            ],
          },
        ],
      },
    },
    '019f8a5b-da92-77e8-a608-7b2ffea1aff9': {
      id: '019f8a5b-da92-77e8-a608-7b2ffea1aff9',
      type: 'quiz',
      title: 'Phase 2',
      syncMode: 'lockstep',
      roles: {
        player: {
          enabled: true,
          showTimer: true,
        },
        central: {
          enabled: true,
          showTimer: true,
          showResults: true,
        },
        host: {
          monitor: ['answers', 'scores'],
        },
      },
      scoring: {
        mode: 'correctness_and_speed',
        maxPoints: 30,
        speedBonus: {
          maxBonus: 50,
          decaySeconds: 7,
        },
      },
      content: {
        type: 'quiz',
        mode: 'central_prompt',
        questions: [
          {
            qType: 'single_choice',
            prompt: [
              {
                kind: 'text',
                markdown: 'Apa kata-kata yang membakar semangat bekerja?',
              },
            ],
            options: [
              {
                id: '019f8d84-fe57-7248-a69b-4aba47a859a0',
                label: 'Yo ndak tahu kok ya tanya saya...',
              },
              {
                id: '019f8d85-00c0-754e-81fd-0b4eefed5326',
                label: 'SAYA AKAN LAWAAAAAN!!111!!11',
              },
              {
                id: '019f8d85-0487-75b8-9179-0d051ca9987e',
                label: 'Uwa kaget!',
              },
              {
                id: '019f8d85-068d-754d-916e-40c06434c773',
                label: 'Selamat 🤘 Berjuang ✊ Suksesssss 👍👋👏',
              },
            ],
            correctId: '019f8d85-00c0-754e-81fd-0b4eefed5326',
          },
          {
            qType: 'single_choice',
            prompt: [
              {
                kind: 'text',
                markdown: 'Berapa 2 + 16?',
              },
            ],
            options: [
              {
                id: '019f8e6b-ace8-7489-86ef-f85fbcb07055',
                label: '18',
              },
              {
                id: '019f8e6b-b969-7006-a1af-95445f37f068',
                label: '7',
              },
              {
                id: '019f8e6b-c070-72cc-82d4-b7abdac02699',
                label: '17',
              },
              {
                id: '019f8e6b-cadb-7516-94f4-68c5986ed336',
                label: '20',
              },
            ],
            correctId: '019f8e6b-c070-72cc-82d4-b7abdac02699',
          },
          {
            qType: 'single_choice',
            prompt: [
              {
                kind: 'text',
                markdown:
                  'Kamu seorang pegawai minimarket, apa yang kamu ucapkan apabila ada pelanggan datang?',
              },
            ],
            options: [
              {
                id: '019f8e6c-4c16-7689-8cdd-2b2961d2c372',
                label: 'Selamat datang 😊 ',
              },
              {
                id: '019f8e6c-4fff-71e3-9d9d-83885b347056',
                label: 'Selamat berbelanja 😊',
              },
              {
                id: '019f8e6c-5299-73ac-ba19-77d5e1a09813',
                label: 'SIAAAP GRAK! 🫡 ',
              },
            ],
            correctId: '019f8e6c-5299-73ac-ba19-77d5e1a09813',
          },
        ],
        revealAnswers: true,
        answeringTimerSeconds: 15,
      },
    },
  },
  publishedAt: 1787822491423,
  publishedBy: 'naufal@expinc.io',
}
