import type { PublishedGame } from '@helden-inc/tg-schema'

export const demoBundlePlayerSafe: PublishedGame = {
  id: '01a106b8-b812-7517-b648-bf14e471b06d',
  gameId: '01a1039c-ed6e-72ba-af2b-ed9990e5e510',
  schemaVersion: '5.1.0',
  title: 'TestFull-V3',
  phaseOrder: [
    '01a1039d-1883-748f-b638-cdeb8ba166d6',
    '01a1039d-1883-748f-b638-d2704582105b',
    '01a1039d-1883-748f-b638-d45a5db4c340',
    '01a1039d-1883-748f-b638-d9686fdad8f6',
    '01a1039d-1883-748f-b638-dd617981fb0b',
    '01a1039d-1883-748f-b638-e2475910bc28',
    '01a1039d-1883-748f-b638-e734d746e66f',
    '01a1039d-1883-748f-b638-e9b07c3f5904',
    '01a1039d-1883-748f-b638-ee4a4f7ee96f',
    '01a1039d-1883-748f-b638-f291a61d6c5d',
    '01a1039d-1883-748f-b638-f72707a3283c',
    '01a1039d-1883-748f-b638-fad5417680f1',
    '01a1039d-1883-748f-b638-fce393bff734',
    '01a1039d-1883-748f-b639-0116dd24cb86',
    '01a1039d-1883-748f-b639-053c22710bca',
    '01a1039d-1883-748f-b639-0a4f3073c10f',
    '01a1039d-1883-748f-b639-0c4d583bce07',
    '01a1039d-1883-748f-b639-11141b3db3bb',
    '01a1039d-1883-748f-b639-153d17536d43',
    '01a1039d-1883-748f-b639-193c4669c809',
    '01a1039d-1883-748f-b639-1e079e1f74d4',
    '01a1039d-1883-748f-b639-23a461a43ea1',
    '01a1039d-1883-748f-b639-27ee96046237',
    '01a1039d-1883-748f-b639-29fecb9d24e7',
    '01a1039d-1883-748f-b639-2cfc64548386',
  ],
  flowMode: 'sequential',
  phases: {
    '01a1039d-1883-748f-b638-cdeb8ba166d6': {
      id: '01a1039d-1883-748f-b638-cdeb8ba166d6',
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
    '01a1039d-1883-748f-b638-d2704582105b': {
      id: '01a1039d-1883-748f-b638-d2704582105b',
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
    '01a1039d-1883-748f-b638-d45a5db4c340': {
      id: '01a1039d-1883-748f-b638-d45a5db4c340',
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
                mediaId: '01a106b6-2df9-7295-bc66-c3b5376f17d9',
                url: 'https://expinc-cdn.azureedge.net/lexibe/1791113964968-Gemini_Generated_Image_udr6koudr6koudr6.webp',
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
                mediaId: '01a106b5-9825-723e-8ba3-c82e10a4bcf3',
                url: 'https://expinc-cdn.azureedge.net/lexibe/1791113926521-Gemini_Generated_Image_dbd0a4dbd0a4dbd0.webp',
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
    '01a1039d-1883-748f-b638-d9686fdad8f6': {
      id: '01a1039d-1883-748f-b638-d9686fdad8f6',
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
    '01a1039d-1883-748f-b638-dd617981fb0b': {
      id: '01a1039d-1883-748f-b638-dd617981fb0b',
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
    '01a1039d-1883-748f-b638-e2475910bc28': {
      id: '01a1039d-1883-748f-b638-e2475910bc28',
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
    '01a1039d-1883-748f-b638-e734d746e66f': {
      id: '01a1039d-1883-748f-b638-e734d746e66f',
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
                  '- Pantun lucu tentang jualan (pemanasan).\n- Minta 3 ide nama atau slogan untuk usahamu.\n- Minta 1 ide gampang buat naikin jualan.',
              },
              {
                kind: 'button',
                variant: 'external-link',
                label: 'Buka Gemini',
                url: 'https://gemini.google.com',
              },
            ],
            title: 'Level 2: Gemini',
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
    '01a1039d-1883-748f-b638-e9b07c3f5904': {
      id: '01a1039d-1883-748f-b638-e9b07c3f5904',
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
          gridRows: 4,
          analysisQuestions: [
            {
              qType: 'single_choice',
              correctId: '01a0ca09-27c7-76b3-8645-2a5a81899d1b',
              prompt: [
                {
                  kind: 'text',
                  markdown:
                    'Berdasarkan data penjualan yang tersedia, produk mana yang paling laku?',
                },
              ],
              options: [
                {
                  id: '01a0ca05-6609-7048-9f8a-fadedf8baccc',
                  label: 'A',
                },
                {
                  label: 'B',
                  id: '01a0ca06-6e3a-71c5-947f-1cf95eb17c74',
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
            },
            {
              correctId: '01a0ca0a-0a5b-7199-8110-ef21e4116526',
              qType: 'single_choice',
              prompt: [
                {
                  kind: 'text',
                  markdown: 'Bisa pastikan hari paling sepi? Kenapa?',
                },
              ],
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
            },
            {
              prompt: [
                {
                  markdown: 'Karena data hilang, apa yang TIDAK bisa dipastikan?',
                  kind: 'text',
                },
              ],
              qType: 'single_choice',
              options: [
                {
                  label: 'Apakah Produk A laku atau tidak',
                  id: '01a0ca0c-8273-76f7-8d52-3d50bfb4c8af',
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
                  label: 'Apakah Produk D laku atau tidak',
                  id: '01a0ca0c-964c-773a-a05e-b1d7ca09919c',
                },
              ],
              correctId: '01a0ca0c-964c-773a-a05e-b1d7ca09919c',
            },
          ],
          rowLabels: ['A', 'B', 'C', 'D'],
          colLabels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
          title: 'Synchronize Physical Matrix',
          emptyCells: [
            {
              row: 'B',
              col: 'Kam',
            },
            {
              col: 'Sel',
              row: 'D',
            },
            {
              row: 'D',
              col: 'Jum',
            },
          ],
          gridCols: 6,
          intro: {
            title: 'Tantangan 1: Analisis',
            steps: [
              'Susun 21 potongan data penjualan di papan.',
              'Tandai 3 kotak yang tetap kosong.',
              'Jawab pertanyaan analisis.',
            ],
            imageUrl:
              'https://expinc-cdn.azureedge.net/lexibe/1791055905038-foto-instruction-figma.webp',
          },
          successMessage: 'Betul. Tiga kotak yang tetap kosong: B–Kamis, D–Selasa, D–Jumat.',
        },
      },
    },
    '01a1039d-1883-748f-b638-ee4a4f7ee96f': {
      id: '01a1039d-1883-748f-b638-ee4a4f7ee96f',
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
          rounds: [
            {
              correctOrder: [
                '01a0ca0f-b31f-7357-9716-742a071f9c97',
                '01a0ca0f-8e7a-773f-a718-bd2522b4cfaf',
                '01a0ca0f-b96e-7448-8a57-502bcdef2ce0',
                '01a0ca0f-be5a-75ba-9725-f4d523422b1d',
              ],
              caseSensitive: false,
              triggerCode: 'RONDE2',
              timerSeconds: 60,
              diff: {
                add: [],
                remove: [],
              },
            },
            {
              caseSensitive: false,
              triggerCode: 'RONDE3',
              diff: {
                remove: ['01a0ca0f-b96e-7448-8a57-502bcdef2ce0'],
                add: [
                  {
                    insertAt: 1,
                    id: '01a0ca11-6e0e-73b1-a65d-fafbee02d824',
                    label: 'E',
                  },
                ],
              },
              timerSeconds: 120,
              correctOrder: [
                '01a0ca11-6e0e-73b1-a65d-fafbee02d824',
                '01a0ca0f-b31f-7357-9716-742a071f9c97',
                '01a0ca0f-8e7a-773f-a718-bd2522b4cfaf',
                '01a0ca0f-be5a-75ba-9725-f4d523422b1d',
              ],
            },
          ],
          items: [
            {
              label: 'Balas pesanan pelanggan',
              id: '01a0ca0f-8e7a-773f-a718-bd2522b4cfaf',
            },
            {
              label: 'Restok bahan',
              id: '01a0ca0f-b31f-7357-9716-742a071f9c97',
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
          correctOrder: [
            '01a0ca0f-8e7a-773f-a718-bd2522b4cfaf',
            '01a0ca0f-b31f-7357-9716-742a071f9c97',
            '01a0ca0f-b96e-7448-8a57-502bcdef2ce0',
            '01a0ca0f-be5a-75ba-9725-f4d523422b1d',
          ],
        },
      },
    },
    '01a1039d-1883-748f-b638-f291a61d6c5d': {
      id: '01a1039d-1883-748f-b638-f291a61d6c5d',
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
    '01a1039d-1883-748f-b638-f72707a3283c': {
      id: '01a1039d-1883-748f-b638-f72707a3283c',
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
            id: '01a106b1-e74f-718a-943c-d55e1c401f02',
            blocks: [
              {
                kind: 'image',
                mediaId: '01a106b2-10ef-751e-829e-110b4cda633e',
                url: 'https://expinc-cdn.azureedge.net/lexibe/1791113695308-Gemini_Generated_Image_dkjyrbdkjyrbdkjy.webp',
              },
            ],
          },
          {
            id: '01a106b3-092e-7684-a9d5-d94470565fdd',
            blocks: [
              {
                kind: 'image',
                mediaId: '01a106b3-26ce-758d-bc92-d095fa30cd5f',
                url: 'https://expinc-cdn.azureedge.net/lexibe/1791113766444-Gemini_Generated_Image_u8vgxvu8vgxvu8vg.webp',
              },
            ],
          },
        ],
        controlledBy: 'host',
      },
    },
    '01a1039d-1883-748f-b638-fad5417680f1': {
      id: '01a1039d-1883-748f-b638-fad5417680f1',
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
          dropZones: 5,
          instructions:
            'Pilih kartu yang membawa ciri khas usaha Bu Sari — masukkan ke tempatnya. Kartu yang bisa dipakai usaha mana saja: biarkan di luar.',
          distractorCards: [
            {
              text: 'Harga terjangkau',
              id: '01a0ca1f-ddb6-73c0-96a3-1ab4f41ea9dd',
            },
            {
              id: '01a0ca1f-faaa-77e2-a705-b87d82fa2b68',
              text: 'Pelayanan ramah',
            },
            {
              id: '01a0ca1f-ff1e-7480-89d2-6fca0c172f96',
              text: 'Kualitas terbaik',
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
          soulCards: [
            {
              id: '01a0ca1f-40e2-726d-a6eb-58ad2a5c4721',
              text: 'Resep warisan nenek',
            },
            {
              id: '01a0ca1f-4522-7201-84d5-21ebc7972bc0',
              text: 'Tiga generasi',
            },
            {
              text: 'Masakan rumahan',
              id: '01a0ca1f-4b26-7473-a71a-a931cb736ef2',
            },
            {
              id: '01a0ca1f-5253-70dd-91c9-d9ed647f177b',
              text: 'Rasa yang Khas',
            },
            {
              text: 'Dimasak sepenuh hati',
              id: '01a0ca1f-5711-7018-b8fd-fff2f489f72a',
            },
          ],
        },
      },
    },
    '01a1039d-1883-748f-b638-fce393bff734': {
      id: '01a1039d-1883-748f-b638-fce393bff734',
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
    '01a1039d-1883-748f-b639-0116dd24cb86': {
      id: '01a1039d-1883-748f-b639-0116dd24cb86',
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
    '01a1039d-1883-748f-b639-053c22710bca': {
      id: '01a1039d-1883-748f-b639-053c22710bca',
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
                  'Sebuah hotel besar ingin memesan produk Bu Sari terus-menerus. Ini kesempatan besar. Manajernya minta presentasi produk hari ini juga, karena malam ini dia harus pergi dan memutuskan sebelum berangkat. Tapi Bu Sari sedang mengerjakan 50 pesanan pelanggan setia yang sudah dibayar. Kalau berhenti, semua pesanan itu telat. AI bisa membuat presentasi bagus dalam 2 menit, tapi hasilnya biasa saja dan tidak terasa seperti Bu Sari. Presentasi yang benar-benar “Bu Sari” butuh 1 jam, dan dia tidak punya waktu. Apa yang sebaiknya dia lakukan?',
              },
            ],
            options: [
              {
                id: '01a0cd67-764b-7711-ba62-238e2934b505',
                label:
                  'A. Pakai presentasi dari AI dan kirim sekarang. 50 pesanan aman, tapi presentasinya terasa biasa dan hotel mungkin tidak melihat keistimewaan Bu Sari.',
              },
              {
                id: '01a0cd67-987f-754f-8f51-e18f5d048249',
                label:
                  'B. Pakai 1 jam untuk membuat presentasi yang benar-benar “Bu Sari”. Hotel bisa melihat keistimewaannya, tapi 50 pesanan telat dan belum tentu hotel memilihnya.',
              },
            ],
          },
        ],
        revealAnswers: false,
        answeringTimerSeconds: 300,
      },
      durationMin: 10,
      hostScript: {
        anchorScript: [
          {
            kind: 'text',
            markdown:
              'Kemarin kita sudah lihat: AI membuat tulisan dengan cepat dan rapi. Tapi kalau dibaca lagi, rasanya bisa punya siapa saja. Hari ini kita cari tahu kenapa. AI tidak tahu apa yang bikin usahamu istimewa, kecuali kamu yang memberi tahu. AI belajar dari jutaan tulisan orang lain. Jadi kalau kamu minta seadanya, hasilnya biasa saja, seperti rata-rata semua orang. Yang membuatnya jadi kamu — resepmu, caramu, ceritamu — hanya ada di kepalamu. Jadi keaslian tidak hilang karena AI. Keaslian hilang kalau kamu berhenti memegang kendali dan menerima hasil AI apa adanya.\n',
          },
          {
            kind: 'text',
            markdown:
              'Bayangkan AI itu seperti bumbu instan. Praktis dan cepat. Tapi kalau kamu cuma buka bungkus dan langsung sajikan, rasanya sama dengan warung sebelah yang pakai bumbu yang sama. Masakanmu jadi masakanmu saat kamu menambahkan racikan sendiri: resep dari ibumu, sentuhan yang cuma kamu tahu. Bumbu instan mempercepat. Tapi tanganmulah yang membuatnya jadi punyamu.\n',
          },
          {
            kind: 'text',
            markdown:
              'Bacakan setelah semua tim mengirim jawaban. Tadi kalian memilih A atau B. Tapi siapa bilang pilihannya cuma dua? Orang yang memegang kendali bisa membuat pilihan sendiri. Kirim versi AI dulu supaya kesempatannya aman. Lalu susulkan sentuhan pribadi saat bertemu langsung, atau kirim contoh produk. Memegang kendali bukan soal menurut pada dua pilihan yang diberikan, tapi berani mencari pilihan ketiga.\n',
          },
        ],
        improvMarker: true,
        sharingPrompts: [
          {
            kind: 'text',
            markdown:
              'Tadi ada yang pilih A, ada yang pilih B. Dua-duanya masuk akal. Sekarang jujur: di usaha kalian sehari-hari, lebih sering yang mana? Pernah nggak, karena buru-buru, kalian mengirim sesuatu yang sebenarnya “bukan kalian banget”?\n',
          },
        ],
      },
    },
    '01a1039d-1883-748f-b639-0a4f3073c10f': {
      id: '01a1039d-1883-748f-b639-0a4f3073c10f',
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
                  'Bu Rina pelanggan setia Bu Sari dan sering membantu mempromosikan produknya. Suatu hari dia bicara dengan tulus: “Bu, produkmu enak. Tapi aku sedih usahamu jalan di tempat. Sekarang orang suka toko yang tampilannya modern: foto bersih, tulisan singkat, rapi. Punyamu penuh cerita panjang dan foto apa adanya, jadi terlihat kuno. Orang muda langsung geser. Coba ikuti yang lain, pasti ramai.” Bu Rina tidak sok tahu. Dia tulus dan bisa jadi benar. Apa yang sebaiknya Bu Sari lakukan?',
              },
            ],
            options: [
              {
                id: '01a0cd35-9315-7638-bb58-18f71aa96cb1',
                label:
                  'A. Ikuti saran Bu Rina. Ubah tampilan jadi modern: foto bersih, tulisan singkat, rapi. Kalau tidak dilirik orang, ceritanya tidak akan terbaca. Tampilan hanya bungkus, rasanya tetap sama.',
              },
              {
                id: '01a0cd37-5d26-7658-96f3-caae8f80d434',
                label:
                  'B. Tetap seperti sekarang: cerita panjang dan foto apa adanya. Itu yang bikin pelanggan jatuh cinta. Kalau ikut-ikutan, usahanya jadi sama dengan toko lain. Risikonya, saran Bu Rina mungkin benar.',
              },
            ],
          },
        ],
        revealAnswers: false,
        answeringTimerSeconds: 300,
      },
      hostScript: {
        anchorScript: [
          {
            kind: 'text',
            markdown:
              'Ada rasa takut baru: kalau semua orang bisa pakai AI untuk membuat tampilan keren dan tulisan bagus, apa yang membuat aku berbeda? Dulu kemampuan itu langka. Sekarang AI membuat semua orang terlihat profesional. Tapi coba balik cara berpikirnya. Kalau semua pakai alat yang sama dan meminta hal yang sama, hasilnya jadi sama saja. Di situ, yang punya sesuatu yang tidak bisa ditiru — ceritamu, caramu — justru paling menonjol. Dorongan untuk “ikut yang lain” akan terus datang, kadang dari pesaing, kadang dari orang yang sayang padamu. Yang menang bukan yang paling ikut tren, tapi yang tahu mana yang boleh disamakan dan mana yang harus tetap miliknya.\n',
          },
          {
            kind: 'text',
            markdown:
              'Bayangkan semua warung diberi bumbu instan gratis yang sama. Semua soto jadi mirip: enak, tapi sama saja. Lalu orang yang kamu percaya bilang, “Pakai bumbu instan itu saja, semua warung sukses pakai itu. Punyamu kelamaan direbus.” Dia tulus. Tapi kalau kamu ikut, sotomu jadi sama seperti yang lain. Yang bikin orang antre justru kaldu rebusanmu sendiri. Saat semua warung memakai bumbu yang sama, warung yang punya kaldu sendiri paling dicari, walau ada yang tulus menyuruhmu berhenti merebus.\n',
          },
          {
            kind: 'text',
            markdown:
              'Bacakan setelah semua tim mengirim jawaban. Tadi kalian harus memilih: ikuti Bu Rina atau menolak. Tapi apa Bu Rina bilang “buang ceritamu”? Tidak. Dia bilang “orang langsung geser”. Itu masalah yang berbeda. Mungkin jawabannya bukan membuang cerita, bukan juga bertahan mati-matian, tapi membuat ceritamu lebih mudah dilirik tanpa menghapusnya. Fotonya lebih terang tapi tetap foto buatan tanganmu. Ceritanya lebih pendek tapi tetap ceritamu. Memegang kendali bukan menolak semua masukan, tapi mengambil yang benar dari masukan tanpa kehilangan dirimu.\n',
          },
        ],
        improvMarker: true,
        sharingPrompts: [
          {
            kind: 'text',
            markdown:
              'Pernah nggak, ada orang yang kalian percaya — pelanggan, keluarga, teman — menyarankan “ubah saja biar seperti yang lain, biar laku”? Gimana rasanya? Kalian ikut atau bertahan? Sekarang, menyesal nggak?\n',
          },
        ],
      },
    },
    '01a1039d-1883-748f-b639-0c4d583bce07': {
      id: '01a1039d-1883-748f-b639-0c4d583bce07',
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
                  'Hari ini hari biasa. Bu Sari capek, seperti biasa kalau punya usaha. AI membuatkan tulisan promo untuk besok. Hasilnya lumayan: tidak istimewa, tapi cukup bagus. Bu Sari tahu, kalau mau, dia bisa meluangkan waktu supaya tulisan itu terdengar seperti dirinya. Tapi dia capek, dan ini cuma satu tulisan. Besok baru dia lebih rajin. Jarinya sudah di atas tombol “posting”. Apa yang sebaiknya dia lakukan?',
              },
            ],
            options: [
              {
                id: '01a0cd3e-4673-7527-b4a0-db3a0fbfad52',
                label:
                  'A. Posting yang dari AI. Sudah cukup bagus dan dia perlu istirahat. Mungkin tidak ada yang sadar bedanya. Besok dia perbaiki.',
              },
              {
                id: '01a0cd3e-b770-72ca-bca6-b755c45efd48',
                label:
                  'B. Tahan dulu dan tulis ulang sampai terasa seperti dirinya. Tapi dia jadi bertanya: “Sanggup nggak aku terus begini, setiap hari, setiap kali capek?” Dia belum tahu jawabannya.',
              },
            ],
          },
        ],
        revealAnswers: false,
        answeringTimerSeconds: 300,
      },
      hostScript: {
        sharingPrompts: [
          {
            kind: 'text',
            markdown:
              'Jujur ke diri sendiri, bukan soal AI saja. Pernah nggak, ada sesuatu yang dulu kalian kerjakan sepenuh hati, lalu pelan-pelan jadi “ya sudahlah, yang penting selesai”? Kapan kalian sadar? Atau baru sadar sekarang?\n',
          },
        ],
        anchorScript: [
          {
            kind: 'text',
            markdown:
              'Ini yang paling halus dan paling berbahaya, karena tidak ada tanda peringatannya. Awalnya kamu masih memegang kendali: membaca hasil AI, memperbaiki, menambah sentuhanmu. Tapi AI itu nyaman dan cepat. Setiap kali hasilnya “ya sudahlah, cukup bagus”, kamu terima apa adanya. Sekali dua kali tidak apa-apa. Tapi pelan-pelan “ya sudahlah” jadi kebiasaan. Kamu berhenti membaca ulang, berhenti memperbaiki, berhenti memasukkan dirimu. Usahamu tetap jalan, tapi kamu tidak lagi ada di dalamnya. Yang menakutkan bukan AI-nya. AI hanya melakukan yang kamu izinkan. Yang menakutkan: kamu tidak sadar kapan itu terjadi. Tidak ada hari ketika kamu memutuskan “mulai sekarang aku menghilang”. Itu terjadi lewat “ya sudahlah” yang terlihat sepele.\n',
          },
          {
            kind: 'text',
            markdown:
              'Bayangkan awalnya kamu masak sendiri dan hanya memakai bumbu instan supaya lebih cepat. Lama-lama, karena capek, kamu menambah satu bahan jadi. Lalu satu lagi. Lalu tinggal dipanaskan. Sampai suatu hari kamu sadar: kamu sudah tidak memasak lagi. Kamu hanya menyajikan buatan orang lain dan menyebutnya masakanmu. Tidak ada satu hari pun kamu memutuskan berhenti memasak. Itu terjadi satu “ya sudahlah” setiap kali. Pelanggan mungkin belum sadar. Tapi kamu tahu: dapur itu sudah bukan dapurmu.\n',
          },
          {
            kind: 'text',
            markdown:
              'Bacakan setelah semua tim mengirim jawaban. Di dua babak tadi ada jalan keluarnya. Di babak ini, aku tidak punya jalan keluar untuk kalian. Karena tidak ada tombol yang berbunyi saat kalian mulai menghilang dari usaha kalian sendiri. Tidak ada yang memberi tahu. Satu-satunya yang bisa menjaga hanya kalian, dengan terus bertanya: “Ini masih aku, atau aku sudah berhenti hadir?” Pertanyaan itu tidak akan pernah selesai. Dan mungkin memang harus begitu. Selama kalian masih bertanya, kalian masih ada di situ.\n',
          },
        ],
        improvMarker: true,
      },
    },
    '01a1039d-1883-748f-b639-11141b3db3bb': {
      id: '01a1039d-1883-748f-b639-11141b3db3bb',
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
    '01a1039d-1883-748f-b639-153d17536d43': {
      id: '01a1039d-1883-748f-b639-153d17536d43',
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
          bridge:
            'Dua hal ini — yang makan waktumu, dan yang bikin usahamu kamu. Sekarang giliranmu pakai AI untuk usahamu sendiri. Pilih satu yang mau kamu kerjakan hari ini:',
          paths: [
            {
              description: 'perbaiki tulisan/promo biar terdengar benar-benar kamu.',
              fields: [
                {
                  placeholderExample: 'Warung Berkah',
                  required: true,
                  label: 'Nama usaha',
                  key: 'nama',
                },
                {
                  placeholderExample: 'nasi kotak untuk acara',
                  label: 'Produk yang mau dipromosikan',
                  required: true,
                  key: 'produk',
                },
                {
                  label: 'Apa yang bikin usahamu beda',
                  placeholderExample: 'porsinya lebih banyak dari yang lain',
                  key: 'beda',
                  required: true,
                  seedSource: 'L2_reflection',
                },
                {
                  key: 'target',
                  label: 'Siapa pembeli yang kamu tuju',
                  placeholderExample: 'ibu-ibu yang mau pesan untuk arisan',
                  required: true,
                },
                {
                  placeholderExample: 'Terima pesanan nasi kotak, harga bersahabat',
                  label: 'Tulisan promo lama (boleh kosong)',
                  required: false,
                  key: 'lama',
                },
              ],
              label: 'Perkuat Suaramu',
              promptTemplate:
                "Kamu adalah asisten yang membantu pemilik usaha kecil di Indonesia memperkuat tulisan promosi. Bahasamu sederhana, hangat, tidak bertele-tele — seperti ngobrol, bukan seperti buku. Ini usaha saya: Nama: {{nama}}. Produk: {{produk}}. Yang bikin beda: {{beda}}. Pembeli dituju: {{target}}. Tulisan lama: {{lama}}. Tugasmu: bantu saya bikin tulisan promo yang terdengar benar-benar SAYA — bukan seperti toko lain.\n\nAturan penting: (1) JANGAN langsung bikin tulisan jadi. Mulai dengan satu contoh kasar, lalu tanya: 'bagian mana yang paling kamu, mana yang masih generik?' (2) Pancing saya menambahkan cerita/cara/detail khas yang cuma saya tahu — jangan kamu karang. (3) Kalau saya minta 'bikinin aja semua', TOLAK dengan ramah: 'bagian ini harus dari kamu, karena ini yang bikin usahamu beda — coba ceritakan sedikit.' Tugasmu memancing, bukan menggantikan. (4) Jawab singkat tiap kali. Ini obrolan, bukan ceramah. Mulai sekarang.",
              id: 'path-a',
            },
            {
              description: 'ambil satu pekerjaan berulang, minta AI bantu.',
              promptTemplate:
                "Kamu asisten yang membantu pemilik usaha kecil di Indonesia menghemat waktu dengan AI. Bahasamu sederhana, hangat, tidak bertele-tele. Ini usaha saya: Nama: {{nama}}. Pekerjaan paling makan waktu: {{kerja}}. Susahnya: {{kenapa}}. Seberapa sering: {{frekuensi}}. Tugasmu: bantu saya cari cara agar AI meringankan pekerjaan ini — TAPI saya tetap yang pegang kendali.\n\nAturan penting: (1) JANGAN langsung kasih solusi jadi. Tanya dulu 2-3 pertanyaan untuk paham betul pekerjaan saya. (2) Setelah paham, tunjukkan bagaimana AI bisa bantu — tapi ingatkan bagian mana yang TETAP harus saya putuskan sendiri. (3) Kalau saya minta 'otomatiskan semua', jelaskan dengan ramah kenapa itu bahaya — bagian mana yang kalau diserahkan penuh ke AI bisa merugikan usaha saya. (4) Jawab singkat, langkah per langkah. Mulai sekarang.",
              label: 'Selesaikan yang Makan Waktu',
              id: 'path-b',
              fields: [
                {
                  required: true,
                  key: 'nama',
                  placeholderExample: 'Warung Berkah',
                  label: 'Nama usaha',
                },
                {
                  key: 'kerja',
                  seedSource: 'L1_seed',
                  label: 'Pekerjaan yang paling makan waktu',
                  placeholderExample: 'balas chat yang nanya harga dan ongkir',
                  required: true,
                },
                {
                  required: true,
                  key: 'kenapa',
                  placeholderExample: 'harus ketik ulang jawaban yang sama tiap ada yang nanya',
                  label: 'Kenapa itu makan waktu / susahnya di mana',
                },
                {
                  label: 'Seberapa sering kamu melakukannya',
                  required: true,
                  placeholderExample: 'tiap hari, puluhan kali',
                  key: 'frekuensi',
                },
              ],
            },
            {
              promptTemplate:
                "Kamu asisten yang membantu pemilik usaha kecil di Indonesia mencari ide baru. Bahasamu sederhana, hangat, tidak bertele-tele. Ini usaha saya: Nama: {{nama}}. Produk: {{produk}}. Yang bikin beda: {{beda}}. Saya lagi buntu soal: {{buntu}}. Tugasmu: bantu saya cari ide yang COCOK dengan usaha saya — bukan ide umum yang bisa dipakai siapa saja.\n\nAturan penting: (1) JANGAN langsung kasih daftar ide. Tanya dulu beberapa hal supaya idenya nyambung dengan keadaan usaha saya yang sebenarnya. (2) Kasih ide yang memanfaatkan apa yang bikin usaha saya BEDA — bukan ide generik 'bikin diskon'/'posting rutin' yang semua orang tahu. (3) Untuk tiap ide, tanya: 'ini cocok nggak sama kamu? kenapa?' — biar saya yang menilai. (4) Jawab singkat. Maksimal 2-3 ide dulu. Mulai sekarang.",
              description: 'buntu mau ke mana? Ajak AI cari ide untuk usahamu.',
              label: 'Cari Ide Baru',
              id: 'path-c',
              fields: [
                {
                  label: 'Nama usaha',
                  required: true,
                  placeholderExample: 'Warung Berkah',
                  key: 'nama',
                },
                {
                  placeholderExample: 'nasi kotak untuk acara',
                  label: 'Produk/jasa kamu',
                  required: true,
                  key: 'produk',
                },
                {
                  label: 'Apa yang bikin usahamu beda',
                  seedSource: 'L2_reflection',
                  key: 'beda',
                  required: true,
                  placeholderExample: 'porsinya lebih banyak dari yang lain',
                },
                {
                  key: 'buntu',
                  placeholderExample: 'mau nambah menu tapi bingung apa yang cocok',
                  required: true,
                  label: 'Kamu lagi buntu soal apa?',
                },
              ],
            },
            {
              promptTemplate:
                'Kamu asisten yang membantu pemilik usaha kecil di Indonesia. Bahasamu sederhana, hangat, tidak bertele-tele. Ini usaha saya: Nama: {{nama}}. Produk: {{produk}}. Pertanyaan saya: {{pertanyaan}}. Tugasmu: bantu jawab dengan langkah KONKRET yang bisa saya coba minggu ini — bukan nasihat umum.\n\nAturan penting: (1) Kalau pertanyaan saya terlalu umum, tanya balik dulu supaya kamu paham situasi saya sebelum menjawab. (2) Kasih 3 langkah konkret, contoh nyata, untuk minggu ini — bukan teori. (3) Kalau ada bagian yang cuma saya yang bisa putuskan, katakan terus terang & kembalikan ke saya. (4) Jawab singkat, langsung ke inti. Mulai sekarang.',
              label: 'Tanya Bebas',
              description:
                'ada satu pertanyaan yang mengganjal soal usahamu? Tanyakan, minta langkah konkret.',
              id: 'path-d',
              fields: [
                {
                  required: true,
                  key: 'nama',
                  label: 'Nama usaha',
                  placeholderExample: 'Warung Berkah',
                },
                {
                  placeholderExample: 'nasi kotak untuk acara',
                  required: true,
                  label: 'Produk/jasa kamu',
                  key: 'produk',
                },
                {
                  key: 'pertanyaan',
                  placeholderExample: 'gimana caranya biar pelanggan balik lagi?',
                  required: true,
                  label: 'Satu pertanyaan yang mengganjal soal usahamu',
                },
              ],
            },
          ],
          instructions:
            '1. Isi form singkat tentang usahamu.\n2. Salin prompt yang sudah jadi.\n3. Buka Gemini di tab baru, lalu tempel di sana.\n4. Ngobrol seperti biasa — kamu yang mengarahkan.\n5. Kalau sudah selesai, kembali ke sini dan tekan Kirim.',
          seeds: [
            {
              stepId: '01a0c93e-4dd3-72b1-8d10-89aa24461e33',
              categoryBlockIndex: 1,
              source: 'L1_seed',
              cardLabel: 'Yang kamu tulis di awal tadi',
              phaseId: '01a0e5fc-97f6-74c0-b179-35f70f629b0b',
              blockIndex: 1,
              categoryStepId: '01a0c93c-3b96-7446-998b-29f6310d7928',
            },
            {
              cardLabel: 'Yang kamu tulis setelah “Suara Bu Sari”',
              phaseId: '01a0e5fc-f7b9-7403-8303-02cd87ce37da',
              source: 'L2_reflection',
            },
          ],
        },
      },
    },
    '01a1039d-1883-748f-b639-193c4669c809': {
      id: '01a1039d-1883-748f-b639-193c4669c809',
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
    '01a1039d-1883-748f-b639-1e079e1f74d4': {
      id: '01a1039d-1883-748f-b639-1e079e1f74d4',
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
          reasonPlaceholder: 'kenapa itu penting buat usahamu',
          reasonLabel: '…supaya…',
          sentenceTemplate: 'Saya akan {{action}}, supaya {{reason}}',
          actionPlaceholder: 'satu langkah konkret untuk minggu depan',
          actionLabel: 'Saya akan…',
          instructions:
            'Satu langkah. Senin depan.\n\nSatu hal konkret yang mau kamu lakukan untuk usahamu minggu depan, pakai yang kamu pelajari hari ini. Lengkapi kalimat di bawah.',
          doneCopy: 'Ini milikmu — bawa pulang. Buka lagi Senin depan.',
        },
      },
    },
    '01a1039d-1883-748f-b639-23a461a43ea1': {
      id: '01a1039d-1883-748f-b639-23a461a43ea1',
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
            id: '01a106ac-c742-7391-bd84-ab905ac4b9f0',
            blocks: [
              {
                kind: 'image',
                mediaId: '01a106ac-fb8e-748c-840e-5869da4206cf',
                url: 'https://expinc-cdn.azureedge.net/lexibe/1791113362137-Gemini_Generated_Image_6q89yy6q89yy6q89.webp',
              },
            ],
          },
        ],
        controlledBy: 'host',
      },
    },
    '01a1039d-1883-748f-b639-27ee96046237': {
      id: '01a1039d-1883-748f-b639-27ee96046237',
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
          seedsHeading: 'Yang kamu tulis di awal',
          seedBindings: [
            {
              stepId: '01a0c93e-4dd3-72b1-8d10-89aa24461e33',
              cardLabel: 'Yang kamu tulis di awal tadi',
              blockIndex: 1,
              categoryStepId: '01a0c93c-3b96-7446-998b-29f6310d7928',
              source: 'L1_seed',
              phaseId: '01a0e5fc-97f6-74c0-b179-35f70f629b0b',
              categoryBlockIndex: 1,
            },
            {
              cardLabel: 'Yang kamu tulis setelah “Suara Bu Sari”',
              phaseId: '01a0e5fc-f7b9-7403-8303-02cd87ce37da',
              source: 'L2_reflection',
            },
          ],
          commitmentPhaseId: '01a0f800-cfc0-7b4e-8be4-f1a7233ab055',
          closingLine: 'Alatnya boleh sama. Kamu yang bikin beda.',
          instructions: 'Ini yang kamu bawa pulang hari ini.',
          commitmentHeading: 'Yang kamu janjikan ke dirimu',
          formToPromptPhaseId: '01a0f800-cfbf-704e-856c-5aa866ff1ef1',
          promptHeading: 'Yang kamu bikin tadi',
        },
      },
    },
    '01a1039d-1883-748f-b639-29fecb9d24e7': {
      id: '01a1039d-1883-748f-b639-29fecb9d24e7',
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
          maxImagePx: 800,
          jpegQuality: 0.6,
          finalLine: 'Alatnya boleh sama. Kamu yang bikin beda.',
          retakeAllowed: true,
          caption: 'Terima kasih sudah membuat hari ini.',
        },
      },
    },
    '01a1039d-1883-748f-b639-2cfc64548386': {
      id: '01a1039d-1883-748f-b639-2cfc64548386',
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
  publishedAt: 1791114131509,
  publishedBy: 'khairulumamku92@gmail.com',
}
