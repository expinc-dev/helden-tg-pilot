import type { PublishedGame } from '@helden-inc/tg-schema'

export const demoBundlePlayerSafe: PublishedGame = {
  id: '01a10370-1733-74ef-82cd-ca6b7e1d50d4',
  gameId: '01a1036f-db29-7791-95af-e00fa3ee3843',
  schemaVersion: '5.1.0',
  title: 'TestFull-V3',
  phaseOrder: [
    '01a10370-03fd-739a-9e34-04a6a8814821',
    '01a10370-03fd-739a-9e34-0bccf2f07902',
    '01a10370-03fd-739a-9e34-0c9b70d66d07',
    '01a10370-03fd-739a-9e34-132e0e05f6c0',
    '01a10370-03fd-739a-9e34-154b14e02392',
    '01a10370-03fd-739a-9e34-1888e56a0691',
    '01a10370-03fd-739a-9e34-1f5cfbc99605',
    '01a10370-03fd-739a-9e34-22c89d5ce3f4',
    '01a10370-03fd-739a-9e34-24689c4d01ea',
    '01a10370-03fd-739a-9e34-29dc34882d37',
    '01a10370-03fd-739a-9e34-2f7cedfaa49d',
    '01a10370-03fd-739a-9e34-31ef3dad0b15',
    '01a10370-03fd-739a-9e34-347e976d62d8',
    '01a10370-03fd-739a-9e34-385a0ee937bd',
    '01a10370-03fd-739a-9e34-3d08c7a903de',
    '01a10370-03fd-739a-9e34-42de48bbbc24',
    '01a10370-03fd-739a-9e34-4690fbaf2513',
    '01a10370-03fd-739a-9e34-497da1100116',
    '01a10370-03fd-739a-9e34-4dcafeb6b68f',
    '01a10370-03fd-739a-9e34-53917e313323',
    '01a10370-03fd-739a-9e34-566aeaf11ac3',
    '01a10370-03fd-739a-9e34-5a703c66d013',
    '01a10370-03fd-739a-9e34-5e81a3a13f40',
    '01a10370-03fd-739a-9e34-636ca41a0368',
    '01a10370-03fd-739a-9e34-67fabcf4064d',
  ],
  flowMode: 'sequential',
  phases: {
    '01a10370-03fd-739a-9e34-04a6a8814821': {
      id: '01a10370-03fd-739a-9e34-04a6a8814821',
      type: 'video',
      title: '1a — Video Pembuka: “Bu Sari”',
      syncMode: 'lockstep',
      roles: {
        player: {
          enabled: true,
        },
        central: {
          enabled: true,
        },
        host: {
          monitor: [],
        },
      },
      scoring: {
        mode: 'none',
      },
      content: {
        type: 'video',
        mediaId: '',
        videoUrl: 'https://vimeo.com/1223535680/50cb341467',
        target: ['central'],
        allowPlayerControl: false,
      },
    },
    '01a10370-03fd-739a-9e34-0bccf2f07902': {
      id: '01a10370-03fd-739a-9e34-0bccf2f07902',
      type: 'quiz',
      title: 'Level 1A: Pernyataan Sikap',
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
        mode: 'none',
      },
      content: {
        type: 'quiz',
        mode: 'on_device',
        questions: [
          {
            qType: 'scale',
            prompt: [
              {
                kind: 'text',
                markdown: 'Sentuhan pribadi itu bagian penting dari produk saya.',
              },
            ],
            min: 1,
            max: 4,
            labels: ['Tidak setuju', 'Sangat setuju'],
          },
          {
            qType: 'scale',
            prompt: [
              {
                kind: 'text',
                markdown: 'AI kelihatannya lebih cocok untuk usaha yang lebih besar.',
              },
            ],
            min: 1,
            max: 4,
            labels: ['Tidak setuju', 'Sangat setuju'],
          },
          {
            qType: 'scale',
            prompt: [
              {
                kind: 'text',
                markdown: 'Saya lebih nyaman kalau bisa mengerjakan semuanya sendiri.',
              },
            ],
            min: 1,
            max: 4,
            labels: ['Tidak setuju', 'Sangat setuju'],
          },
          {
            qType: 'scale',
            prompt: [
              {
                kind: 'text',
                markdown: 'Saya penasaran dengan AI, tapi belum tahu mulai dari mana.',
              },
            ],
            min: 1,
            max: 4,
            labels: ['Tidak setuju', 'Sangat setuju'],
          },
        ],
        revealAnswers: false,
      },
    },
    '01a10370-03fd-739a-9e34-0c9b70d66d07': {
      id: '01a10370-03fd-739a-9e34-0c9b70d66d07',
      type: 'presentation',
      title: 'Level 1B: Kekacauan Terparah',
      syncMode: 'lockstep',
      roles: {
        player: {
          enabled: true,
          showTimer: false,
        },
        central: {
          enabled: true,
        },
        host: {
          monitor: [],
        },
      },
      scoring: {
        mode: 'none',
      },
      content: {
        type: 'presentation',
        slides: [
          {
            id: '01a0c821-57e0-7528-a2a3-aa641ab98e7a',
            blocks: [
              {
                kind: 'image',
                mediaId: '01a0cc7e-1665-773d-a161-2677ac392208',
                url: 'https://expinc-cdn.azureedge.net/lexibe/1790137209657-Gemini_Generated_Image_ojptgoojptgoojpt.webp',
                title: '“Pesanan siap, Pak. Ayam goreng.”',
                caption:
                  'AI diminta gambar “poster untuk jualan ayam goreng”, hasilnya ayam jualan ayam goreng.',
              },
            ],
          },
          {
            id: '01a0c821-ec39-7723-b8d4-7ef56e3098a8',
            blocks: [
              {
                kind: 'image',
                mediaId: '01a0cc80-87ec-74f7-bb6d-30e0b3c95a36',
                url: 'https://expinc-cdn.azureedge.net/lexibe/1790137369846-Gemini_Generated_Image_v5i116v5i116v5i1.webp',
                title: '“Es teh anti-gravitasi.”',
                caption:
                  'AI diminta foto “es teh manis”, gelasnya melayang & sedotannya tembus meja.',
              },
            ],
          },
          {
            id: '01a0c822-2621-706f-bef5-b78f2e5dafd5',
            blocks: [
              {
                kind: 'image',
                mediaId: '01a0cc80-adee-72af-bde2-f1ba04f35c63',
                url: 'https://expinc-cdn.azureedge.net/lexibe/1790137379567-Gemini_Generated_Image_b6g22fb6g22fb6g2.webp',
                title: '“Klaim yang… agak berlebihan.”',
                caption:
                  'AI menulis promo skincare: “Satu tetes serum ini dan kulitmu akan terlihat 10 tahun lebih muda dalam semalam!”',
              },
            ],
          },
          {
            id: '01a0c822-5dc4-75e9-81d6-e2e34ad048a6',
            blocks: [
              {
                kind: 'image',
                mediaId: '01a0cc82-269f-7238-bfe8-00b0d42b6535',
                url: 'https://expinc-cdn.azureedge.net/lexibe/1790137476102-Screenshot%202026-09-23%20111016.webp',
                title: '“Percaya diri. Tapi tepung apa?”',
                caption: 'AI diminta resep roti, tapi hanya menyebut tepung.',
              },
            ],
          },
          {
            id: '01a0c823-110c-74c8-8110-ba2c9310b5a0',
            blocks: [
              {
                kind: 'image',
                mediaId: '01a0cc80-7730-71fe-8017-7c60be95597b',
                url: 'https://expinc-cdn.azureedge.net/lexibe/1790137365608-Gemini_Generated_Image_pvgpwypvgpwypvgp.webp',
                title: '“Kelihatan meyakinkan. Tapi… ini benar?”',
                caption:
                  'AI menulis deskripsi produk yang rapi & meyakinkan, tapi menyebut bahan yang tidak ada (mis. “mengandung madu asli”).',
              },
            ],
          },
        ],
        controlledBy: 'host',
      },
    },
    '01a10370-03fd-739a-9e34-132e0e05f6c0': {
      id: '01a10370-03fd-739a-9e34-132e0e05f6c0',
      type: 'quiz',
      title: 'Level 1C: Kuis Mitos AI',
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
        maxPoints: 1000,
        speedBonus: {
          maxBonus: 500,
          decaySeconds: 30,
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
                markdown: 'AI selalu memberi jawaban yang benar.',
              },
            ],
            options: [
              {
                id: '01a0c932-6924-7678-9a3c-7a00c2969b5c',
                label: 'Benar',
              },
              {
                id: '01a0c932-8f73-7389-b58a-62980906757c',
                label: 'Salah',
              },
            ],
          },
          {
            qType: 'single_choice',
            prompt: [
              {
                kind: 'text',
                markdown: 'Kalau pakai AI, sentuhan pribadi produk saya pasti hilang.',
              },
            ],
            options: [
              {
                id: '01a0c932-e023-7439-a788-29ec41e09d85',
                label: 'Benar',
              },
              {
                id: '01a0c932-f321-745f-a7d4-3ec7fb32f530',
                label: 'Salah',
              },
            ],
          },
          {
            qType: 'single_choice',
            prompt: [
              {
                kind: 'text',
                markdown: 'AI bisa membantu pekerjaan yang berulang-ulang setiap hari.',
              },
            ],
            options: [
              {
                id: '01a0c933-3d1a-7052-988b-2173a696d052',
                label: 'Benar',
              },
              {
                id: '01a0c933-6b34-744b-af66-08de1973d83f',
                label: 'Salah',
              },
            ],
          },
          {
            qType: 'single_choice',
            prompt: [
              {
                kind: 'text',
                markdown: 'Saya harus jago teknologi dulu sebelum boleh mulai.',
              },
            ],
            options: [
              {
                id: '01a0c933-b9da-758e-a596-06c101e0f727',
                label: 'Benar',
              },
              {
                id: '01a0c933-d32f-7498-97db-21803e1e17c3',
                label: 'Salah',
              },
            ],
          },
          {
            qType: 'single_choice',
            prompt: [
              {
                kind: 'text',
                markdown: 'Usaha kecil pun bisa memakai AI.',
              },
            ],
            options: [
              {
                id: '01a0c934-1b47-728a-8515-f5cafca19491',
                label: 'Benar',
              },
              {
                id: '01a0c934-31f6-7352-831b-f9a6e5e0947e',
                label: 'Salah',
              },
            ],
          },
        ],
        revealAnswers: true,
        answeringTimerSeconds: 30,
      },
    },
    '01a10370-03fd-739a-9e34-154b14e02392': {
      id: '01a10370-03fd-739a-9e34-154b14e02392',
      type: 'microlearning',
      title: 'Level 1D: Tanam Benih',
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
            id: '01a0f800-cfb9-79c1-80be-855fad096cac',
            blocks: [
              {
                kind: 'image',
                mediaId: '',
                url: 'https://expinc-cdn.azureedge.net/lexibe/1791055905038-foto-instruction-figma.webp',
                title: 'Level 1D: Tanam Benih',
                caption:
                  '- Pikirkan pekerjaan yang paling makan waktu di usahamu.\n- Pilih bagian yang paling sesuai, atau tulis sendiri.\n- Ceritakan singkat — jawabanmu privat dan dipakai lagi di Level 4.',
              },
            ],
            title: 'Level 1D: Tanam Benih',
          },
          {
            id: '01a0c93c-3b96-7446-998b-29f6310d7928',
            blocks: [
              {
                kind: 'text',
                markdown:
                  'Sebelum lanjut — satu hal tentang usahamu. Setiap hari pasti ada pekerjaan yang paling makan waktu. Yang itu-itu terus. Tulis di HP-mu. Ini rahasia — cuma kamu yang lihat. Nanti kita pakai lagi.',
              },
              {
                kind: 'question',
                question: {
                  qType: 'single_choice',
                  prompt: [
                    {
                      kind: 'text',
                      markdown: 'Bagian mana yang paling makan waktu?',
                    },
                  ],
                  options: [
                    {
                      id: '01a0c93d-4313-761a-b296-d676b1f053ef',
                      label: 'Melayani pelanggan (balas chat, jawab pertanyaan yang sama terus)',
                    },
                    {
                      id: '01a0c93d-56dc-778e-93ad-16b4c57a1606',
                      label:
                        'Promosi & konten (bikin caption, foto produk, deskripsi, sebar promo)',
                    },
                    {
                      id: '01a0c93d-7624-743b-bba6-dc33870ab1ae',
                      label: 'Catatan & administrasi (hitung stok, catat pesanan, rekap)',
                    },
                    {
                      id: '01a0c93d-7a02-7438-b179-713d3b5d5fc1',
                      label: 'Lainnya (tulis sendiri)',
                    },
                  ],
                },
              },
            ],
            title: 'Bagian mana yang paling makan waktu?',
          },
          {
            id: '01a0c93e-4dd3-72b1-8d10-89aa24461e33',
            blocks: [
              {
                kind: 'text',
                markdown:
                  'Ceritakan sedikit, apa persisnya yang bikin makan waktu?\n\n**Contoh: tiap hari balas chat yang nanya harga sama ongkir terus…**',
              },
              {
                kind: 'question',
                question: {
                  qType: 'open_text',
                  prompt: [
                    {
                      kind: 'text',
                      markdown: 'Ceritakan sedikit, apa persisnya yang bikin makan waktu?',
                    },
                  ],
                  maxLen: 300,
                },
              },
            ],
            title: 'Ceritakan sedikit',
            gate: {
              requireAnswered: true,
            },
          },
        ],
      },
    },
    '01a10370-03fd-739a-9e34-1888e56a0691': {
      id: '01a10370-03fd-739a-9e34-1888e56a0691',
      type: 'video',
      title: 'L2-1 Video Pembuka',
      syncMode: 'lockstep',
      roles: {
        player: {
          enabled: true,
        },
        central: {
          enabled: true,
        },
        host: {
          monitor: [],
        },
      },
      scoring: {
        mode: 'none',
      },
      content: {
        type: 'video',
        mediaId: '',
        videoUrl: 'https://vimeo.com/1223535680/50cb341467',
        target: ['central'],
        allowPlayerControl: false,
      },
    },
    '01a10370-03fd-739a-9e34-1f5cfbc99605': {
      id: '01a10370-03fd-739a-9e34-1f5cfbc99605',
      type: 'microlearning',
      title: 'Level 2: Gemini',
      syncMode: 'self_paced',
      teamMode: 'team_leader_only',
      roles: {
        player: {
          enabled: true,
        },
        central: {
          enabled: true,
          showResults: true,
        },
        host: {
          monitor: ['progress', 'scores'],
        },
      },
      timer: {
        seconds: 360,
        authority: 'server',
        autoAdvanceOnExpire: false,
        visibleTo: ['player', 'central'],
      },
      scoring: {
        mode: 'none',
      },
      content: {
        type: 'microlearning',
        mode: 'sequential',
        steps: [
          {
            id: '01a0f800-cfba-7d95-82ff-183fb2767c36',
            blocks: [
              {
                kind: 'image',
                mediaId: '',
                url: 'https://expinc-cdn.azureedge.net/lexibe/1791055905038-foto-instruction-figma.webp',
                title: 'Level 2: Gemini',
                caption:
                  '- Satu anggota tim membuka Gemini di tab baru.\n- Kerjakan 3 tugas pemanasan secara berurutan.\n- Lalu tuliskan pengalamanmu.',
              },
            ],
            title: 'Level 2: Gemini',
          },
          {
            id: '01a0c9ff-b168-71fb-b6bf-747a19f5b322',
            blocks: [
              {
                kind: 'text',
                markdown:
                  'Satu anggota tim buka Gemini di tab baru (nggak perlu install). Ketik bebas, nggak ada aturan salah-benar.\n\n**Tugas 1 —** Minta Gemini bikin **pantun lucu tentang jualan**. Santai aja, ini cuma pemanasan.',
              },
              {
                kind: 'button',
                variant: 'external-link',
                label: 'Buka Gemini',
                url: 'https://gemini.google.com',
              },
            ],
            title: 'Tugas 1 dari 3',
          },
          {
            id: '01a0ca00-dbf4-76b8-b8fe-65046432d6fe',
            blocks: [
              {
                kind: 'text',
                markdown:
                  '**Tugas 2 —** Minta **3 ide nama atau slogan** untuk usahamu. Pilih satu yang paling kamu suka.',
              },
              {
                kind: 'button',
                variant: 'external-link',
                label: 'Buka Gemini',
                url: 'https://gemini.google.com',
              },
            ],
            title: 'Tugas 2 dari 3',
          },
          {
            id: '01a0ca01-dca9-718e-8272-d81ede76dd86',
            blocks: [
              {
                kind: 'text',
                markdown:
                  '**Tugas 3 —** Minta **satu ide gampang buat naikin jualan** yang bisa dicoba minggu ini. Ringan, tapi harus bisa kamu lakukan.',
              },
              {
                kind: 'button',
                variant: 'external-link',
                label: 'Buka Gemini',
                url: 'https://gemini.google.com',
              },
            ],
            title: 'Tugas 3 dari 3',
          },
          {
            id: '01a0f800-cfbb-7f2f-8f5a-9dba5e78db7a',
            blocks: [
              {
                kind: 'text',
                markdown: 'Jawab seluruh pertanyaan.',
              },
              {
                kind: 'question',
                question: {
                  qType: 'open_text',
                  prompt: [
                    {
                      kind: 'text',
                      markdown:
                        'Ceritakan dengan kata katamu sendiri: apa yang kamu minta ke Gemini?',
                    },
                  ],
                  maxLen: 500,
                },
              },
              {
                kind: 'question',
                question: {
                  qType: 'open_text',
                  prompt: [
                    {
                      kind: 'text',
                      markdown:
                        'Ceritakan dengan kata katamu sendiri: bagian mana yang paling membantu?',
                    },
                  ],
                  maxLen: 500,
                },
              },
              {
                kind: 'question',
                question: {
                  qType: 'open_text',
                  prompt: [
                    {
                      kind: 'text',
                      markdown:
                        'Ceritakan dengan kata katamu sendiri: apa yang masih terasa kurang?',
                    },
                  ],
                  maxLen: 500,
                },
              },
            ],
            title: 'Sesi Prompt',
          },
          {
            id: '01a0f800-cfbc-7a67-8356-5ba66995366a',
            blocks: [
              {
                kind: 'text',
                markdown: 'Masukkan jawaban dari Gemini,',
              },
              {
                kind: 'question',
                question: {
                  qType: 'open_text',
                  prompt: [
                    {
                      kind: 'text',
                      markdown: 'Tempel jawaban terbaik dari Gemini di sini.',
                    },
                  ],
                  maxLen: 1000,
                },
              },
            ],
            title: 'Hasil Gemini',
          },
        ],
      },
    },
    '01a10370-03fd-739a-9e34-22c89d5ce3f4': {
      id: '01a10370-03fd-739a-9e34-22c89d5ce3f4',
      type: 'minigame',
      title: 'Level 2A: Analisis',
      syncMode: 'lockstep',
      teamMode: 'team_collaborative',
      roles: {
        player: {
          enabled: true,
        },
        central: {
          enabled: true,
        },
        host: {
          monitor: ['scores', 'progress'],
        },
      },
      timer: {
        seconds: 600,
        authority: 'server',
        autoAdvanceOnExpire: false,
        visibleTo: ['player', 'central'],
      },
      scoring: {
        mode: 'correctness',
        maxPoints: 500,
      },
      content: {
        type: 'minigame',
        templateId: 'analyze_grid',
        config: {
          analysisQuestions: [
            {
              correctId: '01a0ca09-27c7-76b3-8645-2a5a81899d1b',
              options: [
                {
                  id: '01a0ca05-6609-7048-9f8a-fadedf8baccc',
                  label: 'A',
                },
                {
                  id: '01a0ca06-6e3a-71c5-947f-1cf95eb17c74',
                  label: 'B',
                },
                {
                  id: '01a0ca09-27c7-76b3-8645-2a5a81899d1b',
                  label: 'C',
                },
                {
                  id: '01a0ca09-2ca3-7028-82c1-2ec81d3ee3bb',
                  label: 'D',
                },
              ],
              qType: 'single_choice',
              prompt: [
                {
                  kind: 'text',
                  markdown:
                    'Berdasarkan data penjualan yang tersedia, produk mana yang paling laku?',
                },
              ],
            },
            {
              options: [
                {
                  id: '01a0ca09-cc20-702f-9e5e-be63f978ba47',
                  label: 'Kamis',
                },
                {
                  label: 'Selasa',
                  id: '01a0ca0a-0237-740b-bc88-6e72d180ac1e',
                },
                {
                  label: 'Tidak bisa dipastikan',
                  id: '01a0ca0a-0a5b-7199-8110-ef21e4116526',
                },
              ],
              qType: 'single_choice',
              prompt: [
                {
                  kind: 'text',
                  markdown: 'Bisa pastikan hari paling sepi? Kenapa?',
                },
              ],
              correctId: '01a0ca0a-0a5b-7199-8110-ef21e4116526',
            },
            {
              prompt: [
                {
                  kind: 'text',
                  markdown: 'Karena data hilang, apa yang TIDAK bisa dipastikan?',
                },
              ],
              correctId: '01a0ca0c-964c-773a-a05e-b1d7ca09919c',
              qType: 'single_choice',
              options: [
                {
                  id: '01a0ca0c-8273-76f7-8d52-3d50bfb4c8af',
                  label: 'Apakah Produk A laku atau tidak',
                },
                {
                  id: '01a0ca0c-8967-736b-8b07-4f1dfb115aad',
                  label: 'Apakah Produk B laku atau tidak',
                },
                {
                  label: 'Apakah Produk C laku atau tidak',
                  id: '01a0ca0c-8f42-76b2-bd58-9947ad4cc9b7',
                },
                {
                  id: '01a0ca0c-964c-773a-a05e-b1d7ca09919c',
                  label: 'Apakah Produk D laku atau tidak',
                },
              ],
            },
          ],
          colLabels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
          gridRows: 4,
          emptyCells: [
            {
              col: 'Kam',
              row: 'B',
            },
            {
              row: 'D',
              col: 'Sel',
            },
            {
              col: 'Jum',
              row: 'D',
            },
          ],
          gridCols: 6,
          rowLabels: ['A', 'B', 'C', 'D'],
          successMessage: 'Betul. Tiga kotak yang tetap kosong: B–Kamis, D–Selasa, D–Jumat.',
          title: 'Synchronize Physical Matrix',
          intro: {
            imageUrl:
              'https://expinc-cdn.azureedge.net/lexibe/1791055905038-foto-instruction-figma.webp',
            title: 'Tantangan 1: Analisis',
            steps: [
              'Susun 21 potongan data penjualan di papan.',
              'Tandai 3 kotak yang tetap kosong.',
              'Jawab pertanyaan analisis.',
            ],
          },
        },
      },
    },
    '01a10370-03fd-739a-9e34-24689c4d01ea': {
      id: '01a10370-03fd-739a-9e34-24689c4d01ea',
      type: 'minigame',
      title: 'Level 2B: Prioritas',
      syncMode: 'lockstep',
      teamMode: 'team_collaborative',
      roles: {
        player: {
          enabled: true,
        },
        central: {
          enabled: true,
        },
        host: {
          monitor: ['scores', 'progress'],
        },
      },
      timer: {
        seconds: 120,
        authority: 'server',
        autoAdvanceOnExpire: false,
        visibleTo: ['player', 'central'],
      },
      scoring: {
        mode: 'correctness',
        maxPoints: 500,
      },
      content: {
        type: 'minigame',
        templateId: 'sort_order',
        config: {
          correctOrder: [
            '01a0ca0f-8e7a-773f-a718-bd2522b4cfaf',
            '01a0ca0f-b31f-7357-9716-742a071f9c97',
            '01a0ca0f-b96e-7448-8a57-502bcdef2ce0',
            '01a0ca0f-be5a-75ba-9725-f4d523422b1d',
          ],
          items: [
            {
              label: 'Balas pesanan pelanggan',
              id: '01a0ca0f-8e7a-773f-a718-bd2522b4cfaf',
            },
            {
              id: '01a0ca0f-b31f-7357-9716-742a071f9c97',
              label: 'Restok bahan',
            },
            {
              id: '01a0ca0f-b96e-7448-8a57-502bcdef2ce0',
              label: 'Posting promo',
            },
            {
              id: '01a0ca0f-be5a-75ba-9725-f4d523422b1d',
              label: 'Rapikan pembukuan',
            },
          ],
          rounds: [
            {
              triggerCode: 'RONDE2',
              correctOrder: [
                '01a0ca0f-b31f-7357-9716-742a071f9c97',
                '01a0ca0f-8e7a-773f-a718-bd2522b4cfaf',
                '01a0ca0f-b96e-7448-8a57-502bcdef2ce0',
                '01a0ca0f-be5a-75ba-9725-f4d523422b1d',
              ],
              timerSeconds: 60,
              caseSensitive: false,
              diff: {
                remove: [],
                add: [],
              },
            },
            {
              caseSensitive: false,
              diff: {
                remove: ['01a0ca0f-b96e-7448-8a57-502bcdef2ce0'],
                add: [
                  {
                    label: 'E',
                    id: '01a0ca11-6e0e-73b1-a65d-fafbee02d824',
                    insertAt: 1,
                  },
                ],
              },
              triggerCode: 'RONDE3',
              correctOrder: [
                '01a0ca11-6e0e-73b1-a65d-fafbee02d824',
                '01a0ca0f-b31f-7357-9716-742a071f9c97',
                '01a0ca0f-8e7a-773f-a718-bd2522b4cfaf',
                '01a0ca0f-be5a-75ba-9725-f4d523422b1d',
              ],
              timerSeconds: 120,
            },
          ],
        },
      },
    },
    '01a10370-03fd-739a-9e34-29dc34882d37': {
      id: '01a10370-03fd-739a-9e34-29dc34882d37',
      type: 'microlearning',
      title: 'Level 2C: Babak AI',
      syncMode: 'self_paced',
      teamMode: 'team_leader_only',
      roles: {
        player: {
          enabled: true,
        },
        central: {
          enabled: true,
          showResults: false,
        },
        host: {
          monitor: ['progress', 'scores'],
        },
      },
      timer: {
        seconds: 300,
        authority: 'server',
        autoAdvanceOnExpire: false,
        visibleTo: ['player', 'central'],
      },
      scoring: {
        mode: 'none',
      },
      content: {
        type: 'microlearning',
        mode: 'sequential',
        steps: [
          {
            id: '01a0f800-cfbd-7caa-82e1-35bca153bfc3',
            blocks: [
              {
                kind: 'image',
                mediaId: '',
                url: 'https://expinc-cdn.azureedge.net/lexibe/1791055905038-foto-instruction-figma.webp',
                title: 'Level 2C: Babak AI',
                caption:
                  '- Salin data tim dari Challenge 1.\n- Minta bantuan Gemini dengan prompt terstruktur.\n- Bandingkan hasilnya dengan timmu.',
              },
            ],
            title: 'Level 2C: Babak AI',
          },
          {
            id: '01a0ca16-5694-706c-8efe-842157ba6c3f',
            blocks: [
              {
                kind: 'text',
                markdown:
                  'Ini data kita dari Challenge 1. Copy datanya, lalu tempel ke Gemini bersama prompt di langkah berikutnya.\n\n| Produk | Sen | Sel | Rab | Kam | Jum | Sab |\n| :---- | :---- | :---- | :---- | :---- | :---- | :---- |\n| A | 14 | 12 | 15 | 13 | 17 | 18 |\n| B | 13 | 11 | 14 | ? | 16 | 17 |\n| C | 15 | 13 | 16 | 14 | 18 | 15 |\n| D | 4 | ? | 3 | 5 | ? | 6 |\n\nTotal per hari — Sen 46, Sel 36, Rab 48, Kam 32, Jum 51, Sab 56.',
              },
              {
                kind: 'button',
                variant: 'copy',
                label: 'Copy data',
                text: 'Data penjualan 4 produk, 6 hari (angka = terjual; "?" = data hilang):  Produk | Sen | Sel | Rab | Kam | Jum | Sab A | 14 | 12 | 15 | 13 | 17 | 18 B | 13 | 11 | 14 | ? | 16 | 17 C | 15 | 13 | 16 | 14 | 18 | 15 D | 4 | ? | 3 | 5 | ? | 6  Total per hari: Sen 46, Sel 36, Rab 48, Kam 32, Jum 51, Sab 56.',
              },
            ],
            title: 'Data kita dari Challenge 1',
          },
          {
            id: '01a0ca17-3ccf-750b-a306-5d248e266568',
            blocks: [
              {
                kind: 'text',
                markdown:
                  '**Cara minta yang bagus — 3 poin:**\n1. Beri AI **peran & konteks**.\n2. Tugas **jelas & spesifik** (poin bernomor).\n3. Minta **format** (“singkat, bahasa sederhana”).\n\nSalin prompt, buka Gemini, tempel.',
              },
              {
                kind: 'button',
                variant: 'copy',
                label: 'Copy prompt',
                text: 'Kamu adalah analis data untuk pemilik usaha kecil di Indonesia. Bahasamu sederhana dan langsung.\n\nIni data penjualan 4 produk (A-D) selama 6 hari (Sen-Sab). Angka = jumlah terjual, "?" = data hilang:\n[tempel data di sini]\n\nTugasmu:\n1. Tentukan produk mana yang paling laku, dan jelaskan dasarnya.\n2. Sebutkan data mana yang hilang dan apa akibatnya untuk kesimpulan kita.\n3. Beri satu saran konkret berdasarkan data ini.\n4. Kalau ada hal yang tidak bisa kamu pastikan dari data ini, katakan terus terang.\n\nFormat: singkat, bahasa sederhana, poin bernomor.',
              },
              {
                kind: 'button',
                variant: 'external-link',
                label: 'Buka Gemini',
                url: 'https://gemini.google.com',
              },
            ],
            title: 'Minta bantuan AI',
          },
        ],
      },
    },
    '01a10370-03fd-739a-9e34-2f7cedfaa49d': {
      id: '01a10370-03fd-739a-9e34-2f7cedfaa49d',
      type: 'presentation',
      title: 'Level 2D: Benih Keraguan (Baca)',
      syncMode: 'lockstep',
      teamMode: 'team_collaborative',
      roles: {
        player: {
          enabled: true,
        },
        central: {
          enabled: true,
        },
        host: {
          monitor: ['scores'],
        },
      },
      scoring: {
        mode: 'none',
      },
      content: {
        type: 'presentation',
        slides: [
          {
            id: '01a0ca1c-a609-71ad-9cf7-18c40bc516f8',
            blocks: [
              {
                kind: 'text',
                markdown:
                  '**Versi AI:**\n\n“Usaha kami menyediakan produk berkualitas dengan harga terjangkau. Dibuat dengan bahan pilihan dan pelayanan ramah. Kepuasan pelanggan prioritas kami. Pesan sekarang dan rasakan bedanya!”\n\nTandai bagian yang **bisa dipakai toko mana saja**.',
              },
            ],
          },
          {
            id: '01a0ca1d-0c2d-7658-9463-03f4be7cb69d',
            blocks: [
              {
                kind: 'text',
                markdown:
                  '**Sekarang baca sebagai pelanggan:**\n\nKalau 5 toko lain pakai tulisan seperti ini juga — pelanggan bisa bedakan usaha Bu Sari?\n\n**Apa yang hilang?**',
              },
            ],
          },
        ],
        controlledBy: 'host',
      },
    },
    '01a10370-03fd-739a-9e34-31ef3dad0b15': {
      id: '01a10370-03fd-739a-9e34-31ef3dad0b15',
      type: 'minigame',
      title: 'Level 2D: Benih Keraguan (Susun Jiwa)',
      syncMode: 'lockstep',
      teamMode: 'team_collaborative',
      roles: {
        player: {
          enabled: true,
        },
        central: {
          enabled: true,
          showResults: true,
        },
        host: {
          monitor: ['scores', 'answers'],
        },
      },
      scoring: {
        mode: 'participation',
        maxPoints: 200,
      },
      content: {
        type: 'minigame',
        templateId: 'doubt_seed',
        config: {
          soulCards: [
            {
              id: '01a0ca1f-40e2-726d-a6eb-58ad2a5c4721',
              text: 'Resep warisan nenek',
            },
            {
              text: 'Tiga generasi',
              id: '01a0ca1f-4522-7201-84d5-21ebc7972bc0',
            },
            {
              id: '01a0ca1f-4b26-7473-a71a-a931cb736ef2',
              text: 'Masakan rumahan',
            },
            {
              text: 'Rasa yang Khas',
              id: '01a0ca1f-5253-70dd-91c9-d9ed647f177b',
            },
            {
              id: '01a0ca1f-5711-7018-b8fd-fff2f489f72a',
              text: 'Dimasak sepenuh hati',
            },
          ],
          dropZones: 5,
          instructions:
            'Pilih kartu yang membawa ciri khas usaha Bu Sari — masukkan ke tempatnya. Kartu yang bisa dipakai usaha mana saja: biarkan di luar.',
          distractorCards: [
            {
              id: '01a0ca1f-ddb6-73c0-96a3-1ab4f41ea9dd',
              text: 'Harga terjangkau',
            },
            {
              text: 'Pelayanan ramah',
              id: '01a0ca1f-faaa-77e2-a705-b87d82fa2b68',
            },
            {
              text: 'Kualitas terbaik',
              id: '01a0ca1f-ff1e-7480-89d2-6fca0c172f96',
            },
            {
              text: 'Bahan berkualitas',
              id: '01a0ca20-03ea-7089-abc1-d53c6a61dfb8',
            },
            {
              text: 'Kepuasan pelanggan',
              id: '01a0ca20-085a-704b-98cd-fcf7bf889a5b',
            },
          ],
        },
      },
    },
    '01a10370-03fd-739a-9e34-347e976d62d8': {
      id: '01a10370-03fd-739a-9e34-347e976d62d8',
      type: 'reflection',
      title: 'Level 2E: Refleksi',
      syncMode: 'self_paced',
      roles: {
        player: {
          enabled: true,
        },
        central: {
          enabled: true,
        },
        host: {
          monitor: ['answers'],
        },
      },
      scoring: {
        mode: 'participation',
        maxPoints: 100,
      },
      content: {
        type: 'reflection',
        prompt:
          'Apa satu hal dari usahamu yang bikin dia beda, yang cuma ada di punyamu, dan nggak boleh hilang meski dibantu AI?',
        openText: {
          label: 'Tulis di sini',
          maxLen: 300,
        },
        scale: {
          label: 'Seberapa penting ini buat usahamu?',
          min: 1,
          max: 5,
          labels: ['Biasa aja', 'Nggak boleh hilang'],
        },
      },
    },
    '01a10370-03fd-739a-9e34-385a0ee937bd': {
      id: '01a10370-03fd-739a-9e34-385a0ee937bd',
      type: 'video',
      title: 'L3-0 Video Jembatan',
      syncMode: 'lockstep',
      roles: {
        player: {
          enabled: true,
        },
        central: {
          enabled: true,
        },
        host: {
          monitor: [],
        },
      },
      scoring: {
        mode: 'none',
      },
      content: {
        type: 'video',
        mediaId: '01a0ce50-9e94-75b9-a11c-69c9de00989f',
        videoUrl:
          'https://expinc-cdn.azureedge.net/lexibe/1790167784866-5940672-hd_1280_720_25fps.mp4',
        target: ['central'],
        allowPlayerControl: false,
      },
    },
    '01a10370-03fd-739a-9e34-3d08c7a903de': {
      id: '01a10370-03fd-739a-9e34-3d08c7a903de',
      type: 'quiz',
      title: 'Level 3A: Keaslian',
      syncMode: 'lockstep',
      teamMode: 'team_collaborative',
      roles: {
        player: {
          enabled: true,
          showTimer: false,
        },
        central: {
          enabled: true,
          showTimer: false,
          showResults: false,
        },
        host: {
          monitor: ['answers'],
        },
      },
      scoring: {
        mode: 'participation',
        maxPoints: 100,
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
                markdown:
                  'Hotel besar minta presentasi SIANG INI, tapi Bu Sari sedang menyelesaikan 50 pesanan pelanggan setia. Mana yang dipilih?',
              },
            ],
            options: [
              {
                id: '01a0cd67-764b-7711-ba62-238e2934b505',
                label: 'A. Kirim presentasi AI sekarang — rapi, tapi generik',
              },
              {
                id: '01a0cd67-987f-754f-8f51-e18f5d048249',
                label: 'B. Buat versi “Bu Sari” 1 jam — 50 pesanan telat',
              },
            ],
          },
        ],
        revealAnswers: false,
        answeringTimerSeconds: 300,
      },
      durationMin: 10,
    },
    '01a10370-03fd-739a-9e34-42de48bbbc24': {
      id: '01a10370-03fd-739a-9e34-42de48bbbc24',
      type: 'quiz',
      title: 'Level 3B: Keunikan',
      syncMode: 'lockstep',
      teamMode: 'team_collaborative',
      roles: {
        player: {
          enabled: true,
          showTimer: false,
        },
        central: {
          enabled: true,
          showTimer: false,
          showResults: false,
        },
        host: {
          monitor: ['answers'],
        },
      },
      scoring: {
        mode: 'participation',
        maxPoints: 100,
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
                markdown:
                  'Bu Rina, pelanggan setia yang tulus, bilang tampilan Bu Sari kuno dan minta dibuat kekinian. Apa yang Bu Sari lakukan?',
              },
            ],
            options: [
              {
                id: '01a0cd35-9315-7638-bb58-18f71aa96cb1',
                label: 'A. Ikuti Bu Rina — modernkan tampilan',
              },
              {
                id: '01a0cd37-5d26-7658-96f3-caae8f80d434',
                label: 'B. Tetap jadi diri sendiri — cerita & foto apa adanya',
              },
            ],
          },
        ],
        revealAnswers: false,
        answeringTimerSeconds: 300,
      },
    },
    '01a10370-03fd-739a-9e34-4690fbaf2513': {
      id: '01a10370-03fd-739a-9e34-4690fbaf2513',
      type: 'quiz',
      title: 'Level 3C: Kehadiran',
      syncMode: 'lockstep',
      teamMode: 'team_collaborative',
      roles: {
        player: {
          enabled: true,
          showTimer: false,
        },
        central: {
          enabled: true,
          showTimer: false,
          showResults: false,
        },
        host: {
          monitor: ['answers'],
        },
      },
      scoring: {
        mode: 'participation',
        maxPoints: 100,
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
                markdown:
                  'Bu Sari capek. Caption dari AI “cukup bagus”. Jarinya di atas tombol posting. Apa yang dipilih?',
              },
            ],
            options: [
              {
                id: '01a0cd3e-4673-7527-b4a0-db3a0fbfad52',
                label: 'A. Posting yang ini — cukup bagus, istirahat',
              },
              {
                id: '01a0cd3e-b770-72ca-bca6-b755c45efd48',
                label: 'B. Tahan dulu, kerjakan ulang biar jadi dia',
              },
            ],
          },
        ],
        revealAnswers: false,
        answeringTimerSeconds: 300,
      },
    },
    '01a10370-03fd-739a-9e34-497da1100116': {
      id: '01a10370-03fd-739a-9e34-497da1100116',
      type: 'video',
      title: 'L4-0 Video Giliranmu',
      syncMode: 'lockstep',
      roles: {
        player: {
          enabled: true,
        },
        central: {
          enabled: true,
        },
        host: {
          monitor: [],
        },
      },
      scoring: {
        mode: 'none',
      },
      content: {
        type: 'video',
        mediaId: '01a0ce50-9e94-75b9-a11c-69c9de00989f',
        videoUrl:
          'https://expinc-cdn.azureedge.net/lexibe/1790167784866-5940672-hd_1280_720_25fps.mp4',
        target: ['central'],
        allowPlayerControl: false,
      },
    },
    '01a10370-03fd-739a-9e34-4dcafeb6b68f': {
      id: '01a10370-03fd-739a-9e34-4dcafeb6b68f',
      type: 'minigame',
      title: 'Level 4B: Build & Run',
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
        mode: 'participation',
        maxPoints: 300,
      },
      content: {
        type: 'minigame',
        templateId: 'form_to_prompt',
        config: {
          seeds: [
            {
              source: 'L1_seed',
              cardLabel: 'Yang kamu tulis di awal tadi',
              phaseId: '01a0e5fc-97f6-74c0-b179-35f70f629b0b',
              stepId: '01a0c93e-4dd3-72b1-8d10-89aa24461e33',
              blockIndex: 1,
              categoryStepId: '01a0c93c-3b96-7446-998b-29f6310d7928',
              categoryBlockIndex: 1,
            },
            {
              source: 'L2_reflection',
              cardLabel: 'Yang kamu tulis setelah “Suara Bu Sari”',
              phaseId: '01a0e5fc-f7b9-7403-8303-02cd87ce37da',
            },
          ],
          bridge:
            'Dua hal ini — yang makan waktumu, dan yang bikin usahamu kamu. Sekarang giliranmu pakai AI untuk usahamu sendiri. Pilih satu yang mau kamu kerjakan hari ini:',
          instructions:
            '1. Isi form singkat tentang usahamu.\n2. Salin prompt yang sudah jadi.\n3. Buka Gemini di tab baru, lalu tempel di sana.\n4. Ngobrol seperti biasa — kamu yang mengarahkan.\n5. Kalau sudah selesai, kembali ke sini dan tekan Kirim.',
          paths: [
            {
              id: 'path-a',
              label: 'Perkuat Suaramu',
              description: 'perbaiki tulisan/promo biar terdengar benar-benar kamu.',
              fields: [
                {
                  key: 'nama',
                  label: 'Nama usaha',
                  placeholderExample: 'Warung Berkah',
                  required: true,
                },
                {
                  key: 'produk',
                  label: 'Produk yang mau dipromosikan',
                  placeholderExample: 'nasi kotak untuk acara',
                  required: true,
                },
                {
                  key: 'beda',
                  label: 'Apa yang bikin usahamu beda',
                  placeholderExample: 'porsinya lebih banyak dari yang lain',
                  seedSource: 'L2_reflection',
                  required: true,
                },
                {
                  key: 'target',
                  label: 'Siapa pembeli yang kamu tuju',
                  placeholderExample: 'ibu-ibu yang mau pesan untuk arisan',
                  required: true,
                },
                {
                  key: 'lama',
                  label: 'Tulisan promo lama (boleh kosong)',
                  placeholderExample: 'Terima pesanan nasi kotak, harga bersahabat',
                  required: false,
                },
              ],
              promptTemplate:
                "Kamu adalah asisten yang membantu pemilik usaha kecil di Indonesia memperkuat tulisan promosi. Bahasamu sederhana, hangat, tidak bertele-tele — seperti ngobrol, bukan seperti buku. Ini usaha saya: Nama: {{nama}}. Produk: {{produk}}. Yang bikin beda: {{beda}}. Pembeli dituju: {{target}}. Tulisan lama: {{lama}}. Tugasmu: bantu saya bikin tulisan promo yang terdengar benar-benar SAYA — bukan seperti toko lain.\n\nAturan penting: (1) JANGAN langsung bikin tulisan jadi. Mulai dengan satu contoh kasar, lalu tanya: 'bagian mana yang paling kamu, mana yang masih generik?' (2) Pancing saya menambahkan cerita/cara/detail khas yang cuma saya tahu — jangan kamu karang. (3) Kalau saya minta 'bikinin aja semua', TOLAK dengan ramah: 'bagian ini harus dari kamu, karena ini yang bikin usahamu beda — coba ceritakan sedikit.' Tugasmu memancing, bukan menggantikan. (4) Jawab singkat tiap kali. Ini obrolan, bukan ceramah. Mulai sekarang.",
            },
            {
              id: 'path-b',
              label: 'Selesaikan yang Makan Waktu',
              description: 'ambil satu pekerjaan berulang, minta AI bantu.',
              fields: [
                {
                  key: 'nama',
                  label: 'Nama usaha',
                  placeholderExample: 'Warung Berkah',
                  required: true,
                },
                {
                  key: 'kerja',
                  label: 'Pekerjaan yang paling makan waktu',
                  placeholderExample: 'balas chat yang nanya harga dan ongkir',
                  seedSource: 'L1_seed',
                  required: true,
                },
                {
                  key: 'kenapa',
                  label: 'Kenapa itu makan waktu / susahnya di mana',
                  placeholderExample: 'harus ketik ulang jawaban yang sama tiap ada yang nanya',
                  required: true,
                },
                {
                  key: 'frekuensi',
                  label: 'Seberapa sering kamu melakukannya',
                  placeholderExample: 'tiap hari, puluhan kali',
                  required: true,
                },
              ],
              promptTemplate:
                "Kamu asisten yang membantu pemilik usaha kecil di Indonesia menghemat waktu dengan AI. Bahasamu sederhana, hangat, tidak bertele-tele. Ini usaha saya: Nama: {{nama}}. Pekerjaan paling makan waktu: {{kerja}}. Susahnya: {{kenapa}}. Seberapa sering: {{frekuensi}}. Tugasmu: bantu saya cari cara agar AI meringankan pekerjaan ini — TAPI saya tetap yang pegang kendali.\n\nAturan penting: (1) JANGAN langsung kasih solusi jadi. Tanya dulu 2-3 pertanyaan untuk paham betul pekerjaan saya. (2) Setelah paham, tunjukkan bagaimana AI bisa bantu — tapi ingatkan bagian mana yang TETAP harus saya putuskan sendiri. (3) Kalau saya minta 'otomatiskan semua', jelaskan dengan ramah kenapa itu bahaya — bagian mana yang kalau diserahkan penuh ke AI bisa merugikan usaha saya. (4) Jawab singkat, langkah per langkah. Mulai sekarang.",
            },
            {
              id: 'path-c',
              label: 'Cari Ide Baru',
              description: 'buntu mau ke mana? Ajak AI cari ide untuk usahamu.',
              fields: [
                {
                  key: 'nama',
                  label: 'Nama usaha',
                  placeholderExample: 'Warung Berkah',
                  required: true,
                },
                {
                  key: 'produk',
                  label: 'Produk/jasa kamu',
                  placeholderExample: 'nasi kotak untuk acara',
                  required: true,
                },
                {
                  key: 'beda',
                  label: 'Apa yang bikin usahamu beda',
                  placeholderExample: 'porsinya lebih banyak dari yang lain',
                  seedSource: 'L2_reflection',
                  required: true,
                },
                {
                  key: 'buntu',
                  label: 'Kamu lagi buntu soal apa?',
                  placeholderExample: 'mau nambah menu tapi bingung apa yang cocok',
                  required: true,
                },
              ],
              promptTemplate:
                "Kamu asisten yang membantu pemilik usaha kecil di Indonesia mencari ide baru. Bahasamu sederhana, hangat, tidak bertele-tele. Ini usaha saya: Nama: {{nama}}. Produk: {{produk}}. Yang bikin beda: {{beda}}. Saya lagi buntu soal: {{buntu}}. Tugasmu: bantu saya cari ide yang COCOK dengan usaha saya — bukan ide umum yang bisa dipakai siapa saja.\n\nAturan penting: (1) JANGAN langsung kasih daftar ide. Tanya dulu beberapa hal supaya idenya nyambung dengan keadaan usaha saya yang sebenarnya. (2) Kasih ide yang memanfaatkan apa yang bikin usaha saya BEDA — bukan ide generik 'bikin diskon'/'posting rutin' yang semua orang tahu. (3) Untuk tiap ide, tanya: 'ini cocok nggak sama kamu? kenapa?' — biar saya yang menilai. (4) Jawab singkat. Maksimal 2-3 ide dulu. Mulai sekarang.",
            },
            {
              id: 'path-d',
              label: 'Tanya Bebas',
              description:
                'ada satu pertanyaan yang mengganjal soal usahamu? Tanyakan, minta langkah konkret.',
              fields: [
                {
                  key: 'nama',
                  label: 'Nama usaha',
                  placeholderExample: 'Warung Berkah',
                  required: true,
                },
                {
                  key: 'produk',
                  label: 'Produk/jasa kamu',
                  placeholderExample: 'nasi kotak untuk acara',
                  required: true,
                },
                {
                  key: 'pertanyaan',
                  label: 'Satu pertanyaan yang mengganjal soal usahamu',
                  placeholderExample: 'gimana caranya biar pelanggan balik lagi?',
                  required: true,
                },
              ],
              promptTemplate:
                'Kamu asisten yang membantu pemilik usaha kecil di Indonesia. Bahasamu sederhana, hangat, tidak bertele-tele. Ini usaha saya: Nama: {{nama}}. Produk: {{produk}}. Pertanyaan saya: {{pertanyaan}}. Tugasmu: bantu jawab dengan langkah KONKRET yang bisa saya coba minggu ini — bukan nasihat umum.\n\nAturan penting: (1) Kalau pertanyaan saya terlalu umum, tanya balik dulu supaya kamu paham situasi saya sebelum menjawab. (2) Kasih 3 langkah konkret, contoh nyata, untuk minggu ini — bukan teori. (3) Kalau ada bagian yang cuma saya yang bisa putuskan, katakan terus terang & kembalikan ke saya. (4) Jawab singkat, langsung ke inti. Mulai sekarang.',
            },
          ],
        },
      },
    },
    '01a10370-03fd-739a-9e34-53917e313323': {
      id: '01a10370-03fd-739a-9e34-53917e313323',
      type: 'microlearning',
      title: 'Level 4C: Show It Off',
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
          monitor: ['answers'],
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
            id: '01a0cdf7-ff92-71ca-a048-adc0e31746f1',
            blocks: [
              {
                kind: 'text',
                markdown:
                  '## Hasilmu hari ini\n\nPilih satu — semuanya boleh:\n1. **Simpan sendiri** — cuma buat kamu.\n2. **Galeri anonim** — tayang di layar besar tanpa nama.\n3. **Panggung** — ajukan diri bercerita (5–6 orang, dipilih host).\n\nNggak ada juara di sini.',
              },
              {
                kind: 'question',
                question: {
                  qType: 'single_choice',
                  prompt: [
                    {
                      kind: 'text',
                      markdown: 'Apa yang mau kamu lakukan dengan hasilmu?',
                    },
                  ],
                  options: [
                    {
                      id: '01a0cdf9-a2b7-753d-b082-e7144bac2d70',
                      label: 'Simpan sendiri',
                    },
                    {
                      id: '01a0cdf9-a636-7715-aadd-5cfb541174e1',
                      label: 'Tampilkan di galeri (anonim)',
                    },
                    {
                      id: '01a0cdf9-aa1f-724a-a960-3dc994c0c8b2',
                      label: 'Saya mau bercerita di panggung',
                    },
                  ],
                },
              },
            ],
            title: 'Pilih cara kamu menampilkan hasilnya',
          },
        ],
      },
    },
    '01a10370-03fd-739a-9e34-566aeaf11ac3': {
      id: '01a10370-03fd-739a-9e34-566aeaf11ac3',
      type: 'minigame',
      title: 'Closing 1 — Komitmen',
      syncMode: 'self_paced',
      teamMode: 'individual',
      roles: {
        player: {
          enabled: true,
        },
        central: {
          enabled: true,
        },
        host: {
          monitor: ['progress'],
        },
      },
      scoring: {
        mode: 'participation',
        maxPoints: 200,
      },
      content: {
        type: 'minigame',
        templateId: 'commitment',
        config: {
          instructions:
            'Satu langkah. Senin depan.\n\nSatu hal konkret yang mau kamu lakukan untuk usahamu minggu depan, pakai yang kamu pelajari hari ini. Lengkapi kalimat di bawah.',
          actionLabel: 'Saya akan…',
          reasonLabel: '…supaya…',
          actionPlaceholder: 'satu langkah konkret untuk minggu depan',
          reasonPlaceholder: 'kenapa itu penting buat usahamu',
          sentenceTemplate: 'Saya akan {{action}}, supaya {{reason}}',
          doneCopy: 'Ini milikmu — bawa pulang. Buka lagi Senin depan.',
        },
      },
    },
    '01a10370-03fd-739a-9e34-5a703c66d013': {
      id: '01a10370-03fd-739a-9e34-5a703c66d013',
      type: 'presentation',
      title: 'Closing 2 — Perjalananmu',
      syncMode: 'lockstep',
      roles: {
        player: {
          enabled: true,
        },
        central: {
          enabled: true,
        },
        host: {
          monitor: [],
        },
      },
      scoring: {
        mode: 'none',
      },
      content: {
        type: 'presentation',
        slides: [
          {
            id: '01a0cdff-bb2b-71bf-aa40-4faeb7abf113',
            blocks: [
              {
                kind: 'text',
                markdown:
                  'Hari ini kamu **menulis** apa yang paling makan waktu, **menemukan** apa yang bikin usahamu KAMU, dan **bikin** sesuatu yang cuma bisa jadi milikmu.\n\nKamu nggak butuh jadi ahli AI. Kamu cuma butuh tetap jadi kamu — sambil alatnya bantu.',
              },
            ],
          },
        ],
        controlledBy: 'host',
      },
    },
    '01a10370-03fd-739a-9e34-5e81a3a13f40': {
      id: '01a10370-03fd-739a-9e34-5e81a3a13f40',
      type: 'minigame',
      title: 'Closing 2b — Ringkasan',
      syncMode: 'self_paced',
      teamMode: 'individual',
      roles: {
        player: {
          enabled: true,
        },
        central: {
          enabled: true,
        },
        host: {
          monitor: [],
        },
      },
      scoring: {
        mode: 'none',
      },
      content: {
        type: 'minigame',
        templateId: 'journey',
        config: {
          instructions: 'Ini yang kamu bawa pulang hari ini.',
          seedBindings: [
            {
              source: 'L1_seed',
              cardLabel: 'Yang kamu tulis di awal tadi',
              phaseId: '01a0e5fc-97f6-74c0-b179-35f70f629b0b',
              stepId: '01a0c93e-4dd3-72b1-8d10-89aa24461e33',
              blockIndex: 1,
              categoryStepId: '01a0c93c-3b96-7446-998b-29f6310d7928',
              categoryBlockIndex: 1,
            },
            {
              source: 'L2_reflection',
              cardLabel: 'Yang kamu tulis setelah “Suara Bu Sari”',
              phaseId: '01a0e5fc-f7b9-7403-8303-02cd87ce37da',
            },
          ],
          formToPromptPhaseId: '01a0f800-cfbf-704e-856c-5aa866ff1ef1',
          commitmentPhaseId: '01a0f800-cfc0-7b4e-8be4-f1a7233ab055',
          seedsHeading: 'Yang kamu tulis di awal',
          promptHeading: 'Yang kamu bikin tadi',
          commitmentHeading: 'Yang kamu janjikan ke dirimu',
          closingLine: 'Alatnya boleh sama. Kamu yang bikin beda.',
        },
      },
    },
    '01a10370-03fd-739a-9e34-636ca41a0368': {
      id: '01a10370-03fd-739a-9e34-636ca41a0368',
      type: 'minigame',
      title: 'Closing 3 — Selfie Tim',
      syncMode: 'lockstep',
      teamMode: 'team_collaborative',
      roles: {
        player: {
          enabled: true,
        },
        central: {
          enabled: true,
        },
        host: {
          monitor: ['scores'],
        },
      },
      scoring: {
        mode: 'participation',
        maxPoints: 200,
      },
      content: {
        type: 'minigame',
        templateId: 'team_selfie',
        config: {
          finalLine: 'Alatnya boleh sama. Kamu yang bikin beda.',
          caption: 'Terima kasih sudah membuat hari ini.',
          maxImagePx: 800,
          retakeAllowed: true,
          jpegQuality: 0.6,
        },
      },
    },
    '01a10370-03fd-739a-9e34-67fabcf4064d': {
      id: '01a10370-03fd-739a-9e34-67fabcf4064d',
      type: 'end',
      title: 'Selesai L4',
      syncMode: 'lockstep',
      roles: {
        player: {
          enabled: true,
        },
        central: {
          enabled: true,
        },
        host: {
          monitor: [],
        },
      },
      scoring: {
        mode: 'none',
      },
      content: {
        type: 'end',
        title: 'Selesai',
        text: 'Thank You',
      },
    },
  },
  publishedAt: 1791059040056,
  publishedBy: 'khairulumamku92@gmail.com',
}
