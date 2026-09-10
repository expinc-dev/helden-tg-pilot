import type { PublishedGame } from '@helden-inc/tg-schema'

export const demoBundle: PublishedGame = {
  id: '01a08986-5f22-7650-9c7e-7f88e1c02665',
  gameId: '01a08964-779f-75ec-9da1-68c752088a15',
  schemaVersion: '4.5.0',
  title: 'Path Question QA Event',
  phaseOrder: ['01a0896a-8740-7153-bbae-73daa365218e'],
  flowMode: 'sequential',
  phases: {
    '01a0896a-8740-7153-bbae-73daa365218e': {
      id: '01a0896a-8740-7153-bbae-73daa365218e',
      type: 'microlearning',
      title: 'Path Question Microlearning',
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
            id: '01a0896b-5665-75a3-9e3c-ac0700cc75b5',
            blocks: [
              {
                kind: 'question',
                question: {
                  qType: 'path_question',
                  prompt: [
                    {
                      kind: 'text',
                      markdown: 'Pilih jalur penanganan customer yang tepat',
                    },
                  ],
                  cases: [
                    {
                      id: '01a0896c-c1c4-77bd-b31f-580dd5cb3359',
                      label: 'Customer marah karena keterlambatan pengiriman',
                      task: [
                        {
                          kind: 'text',
                          markdown:
                            'Sampaikan permintaan maaf, cek nomor resi, dan tawarkan kompensasi voucher pengiriman berikutnya.',
                        },
                      ],
                    },
                    {
                      id: '01a0896c-c1c4-77bd-b31f-5d500f2ffb16',
                      label: 'Customer bertanya cara refund produk cacat',
                      task: [
                        {
                          kind: 'text',
                          markdown:
                            'Verifikasi bukti foto produk cacat, jelaskan kebijakan refund 14 hari, dan proses pengajuan retur.',
                        },
                      ],
                    },
                    {
                      id: '01a0896f-662f-73fd-bc38-24cfe7a8372c',
                      label: 'Bonus: Customer VIP komplain lewat media sosial',
                      task: [
                        {
                          kind: 'text',
                          markdown:
                            'Balas komentar dengan tenang, ajak DM untuk detail, dan eskalasi ke tim social media crisis dalam 15 menit.',
                        },
                      ],
                      hidden: true,
                    },
                  ],
                  unlockAfterCases: 1,
                },
              },
            ],
            title: 'Path Question Demo',
          },
        ],
      },
    },
  },
  publishedAt: 1789013679907,
  publishedBy: 'yosuasurianto72@gmail.com',
}
