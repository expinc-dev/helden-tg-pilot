import { parseBlocks } from './richText'

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a !== e) throw new Error(`FAIL ${label}: expected ${e}, got ${a}`)
}

assertEqual(
  parseBlocks('hello world'),
  [{ type: 'paragraph', text: 'hello world' }],
  'plain paragraph'
)

assertEqual(
  parseBlocks('- a\n- b\n- c'),
  [{ type: 'list', items: ['a', 'b', 'c'] }],
  'consecutive bullets group into one list'
)

assertEqual(
  parseBlocks('intro\n- a\n- b\noutro'),
  [
    { type: 'paragraph', text: 'intro' },
    { type: 'list', items: ['a', 'b'] },
    { type: 'paragraph', text: 'outro' },
  ],
  'paragraph, list, paragraph split correctly'
)

assertEqual(
  parseBlocks('* star bullet'),
  [{ type: 'list', items: ['star bullet'] }],
  'asterisk bullet supported'
)

assertEqual(parseBlocks('\n\n  \n'), [], 'blank lines produce no segments')

console.log('OK')
