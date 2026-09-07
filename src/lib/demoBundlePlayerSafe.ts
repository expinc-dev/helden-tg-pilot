import type { PublishedGame } from '@helden-inc/tg-schema'

export const demoBundlePlayerSafe: PublishedGame = {
  id: '01a0797c-ff2d-762f-9f89-963f4c40c764',
  gameId: '01a01de3-ac5c-73d9-90ad-fef2a16932b4',
  schemaVersion: '4.2.0',
  title: '25 Sept 2026',
  phaseOrder: [
    '01a01de9-803d-744c-a804-b7c83bea991f',
    '01a01e0f-5a0f-735f-b14c-ffb0339e816f',
    '01a05536-650c-77ed-a298-d9367b390cee',
    '01a07977-580c-7643-8ef1-092112ca6fe9',
  ],
  flowMode: 'sequential',
  phases: {
    '01a01de9-803d-744c-a804-b7c83bea991f': {
      id: '01a01de9-803d-744c-a804-b7c83bea991f',
      type: 'video',
      title: 'Opening',
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
        type: 'video',
        mediaId: '',
        videoUrl: 'https://vimeo.com/1223535680/50cb341467',
        target: ['central'],
        allowPlayerControl: false,
      },
    },
    '01a01e0f-5a0f-735f-b14c-ffb0339e816f': {
      id: '01a01e0f-5a0f-735f-b14c-ffb0339e816f',
      type: 'presentation',
      title: 'presentation 1',
      syncMode: 'lockstep',
      roles: {
        player: {
          enabled: false,
        },
        central: {
          enabled: true,
          showTimer: true,
        },
        host: {
          monitor: [],
        },
      },
      timer: {
        seconds: 300,
        authority: 'server',
        autoAdvanceOnExpire: false,
        visibleTo: ['central'],
      },
      scoring: {
        mode: 'none',
      },
      content: {
        type: 'presentation',
        slides: [
          {
            id: '01a0796b-bd39-74ee-bf6e-9a24a582cc8c',
            blocks: [
              {
                kind: 'image',
                mediaId: '01a0796d-96c6-778d-8160-01034c63477a',
                url: 'https://expinc-cdn.azureedge.net/lexibe/1788743630293-Central%20-%20Presentation%20-%20V1%20(1).webp',
                title: 'Title slide 1',
                caption: 'caption **slide** *satu* style __underline__\n- list item 1\n- item 2',
              },
              {
                kind: 'image',
                mediaId: '01a0796e-9897-703f-a32b-0463073b4474',
                url: 'https://expinc-cdn.azureedge.net/lexibe/1788743696502-presentation1.webp',
              },
              {
                kind: 'video',
                mediaId: '',
                url: 'https://vimeo.com/1223375513/096f90456c',
                autoplay: true,
              },
              {
                kind: 'text',
                markdown: 'Text only no style',
              },
              {
                kind: 'heading',
                text: 'Heading',
              },
              {
                kind: 'timer',
                seconds: 20,
                direction: 'down',
              },
            ],
          },
        ],
        controlledBy: 'host',
      },
    },
    '01a05536-650c-77ed-a298-d9367b390cee': {
      id: '01a05536-650c-77ed-a298-d9367b390cee',
      type: 'microlearning',
      title: 'aa',
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
            id: '01a07970-69bc-71df-8d6f-c722712130a2',
            blocks: [
              {
                kind: 'text',
                markdown: 'just text',
              },
              {
                kind: 'question',
                question: {
                  qType: 'single_choice',
                  prompt: [
                    {
                      kind: 'text',
                      markdown: 'questions',
                    },
                  ],
                  options: [
                    {
                      id: '01a07971-399b-758d-ac86-4aa7722dd3f2',
                      label: 'option 1',
                    },
                    {
                      id: '01a07971-3ece-709f-bbb6-63959c76b6e3',
                      label: 'option 2 (correct)',
                    },
                    {
                      id: '01a07971-6f09-708f-b29b-21e2a60fb986',
                      label: 'option 3',
                    },
                    {
                      id: '01a07971-7bfe-70cc-bd54-0c267311b475',
                      label: 'option 4',
                    },
                  ],
                },
              },
            ],
            thumbnailMediaId: '01a07970-ff85-74a8-97b3-9514f3e63d84',
            thumbnailUrl: 'https://expinc-cdn.azureedge.net/lexibe/1788743853886-Lotte.webp',
            title: 'title 1',
            gate: {
              requireAnswered: true,
            },
          },
          {
            id: '01a07971-b6da-738f-bd3c-690de7e7e31a',
            blocks: [
              {
                kind: 'video',
                mediaId: '',
                url: 'https://vimeo.com/1223219089/3bcb1d0011',
              },
              {
                kind: 'question',
                question: {
                  qType: 'open_text',
                  prompt: [
                    {
                      kind: 'text',
                      markdown: 'iki question',
                    },
                  ],
                  maxLen: 100,
                  rubricHint: 'rubric hint',
                },
              },
            ],
            thumbnailMediaId: '01a07971-e1df-7553-947b-52030b27a8a2',
            thumbnailUrl: 'https://expinc-cdn.azureedge.net/lexibe/1788743911767-Lucas.webp',
            title: 'title 2',
          },
        ],
      },
    },
    '01a07977-580c-7643-8ef1-092112ca6fe9': {
      id: '01a07977-580c-7643-8ef1-092112ca6fe9',
      type: 'quiz',
      title: 'quiz',
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
        mode: 'central_prompt',
        questions: [
          {
            qType: 'single_choice',
            prompt: [
              {
                kind: 'text',
                markdown: 'pilih 1',
              },
            ],
            options: [
              {
                id: '01a07977-ab42-76f6-a50f-3b3b1c98911d',
                label: 'option 1',
              },
              {
                id: '01a07977-cf70-715d-b4c2-f06b32900807',
                label: 'option 2',
              },
              {
                id: '01a07977-d3ff-761a-bcfd-24d65fef9c96',
                label: 'option 3',
              },
            ],
          },
          {
            qType: 'multi_choice',
            prompt: [
              {
                kind: 'text',
                markdown: 'pilih 1 dan 3',
              },
            ],
            options: [
              {
                id: '01a07978-1d08-708e-91b3-7021e7a22732',
                label: 'option 1',
              },
              {
                id: '01a07978-3dd7-73f4-8641-ea95a2d27a4d',
                label: 'option 2',
              },
              {
                id: '01a07978-4ba5-736a-b86c-80bbfb5f9cd2',
                label: 'option 3',
              },
              {
                id: '01a07978-599a-752d-91da-197815cd9f95',
                label: 'option 4',
              },
            ],
          },
          {
            qType: 'scale',
            prompt: [
              {
                kind: 'text',
                markdown: 'coba scale',
              },
            ],
            min: 1,
            max: 10,
            labels: ['1', '10'],
          },
          {
            qType: 'short_answer',
            prompt: [
              {
                kind: 'text',
                markdown: 'short answer, fill in "oke", "mantap"',
              },
            ],
          },
          {
            qType: 'single_choice',
            prompt: [
              {
                kind: 'text',
                markdown: 'single choice lagi',
              },
            ],
            options: [
              {
                id: '01a0797a-03d7-76cb-a76b-21373fda9dfe',
                label: 'jawaban 1',
              },
              {
                id: '01a0797a-26da-7268-bb76-c697776c8dfe',
                label: 'jawaban 2 (benar)',
              },
              {
                id: '01a0797a-5636-77af-833d-03baeb7b3f8c',
                label: 'jawaban 3',
              },
            ],
          },
        ],
        revealAnswers: true,
        answeringTimerSeconds: 20,
      },
    },
  },
  publishedAt: 1788744630077,
  publishedBy: 'naufal@expinc.io',
}
