// Runnable self-check for detectProvider / vimeoEmbedUrl. No test runner / node
// types needed:
//   npx tsx checks/phases/videoProvider.selfcheck.ts
// Excluded from the app build (tsconfig.app.json includes only "src").
import { detectProvider, vimeoEmbedUrl } from '../../src/phases/Video/lib'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}
const eq = (a: string, b: string, msg: string) => ok(a === b, `${msg} (got "${a}", want "${b}")`)

// Regression that produced the bug report: the bundled demo video is a bare
// youtu.be URL, which the old (?:^|\.)-anchored regex classified as 'direct'
// and handed to a native <video> element → NotSupportedError, silent no-play.
eq(
  detectProvider('https://youtu.be/FUKmyRLOlAA?si=-nRBmiIXdAkMhRe1'),
  'youtube',
  'bare youtu.be URL (the bundled demo video)'
)
eq(detectProvider('https://youtube.com/watch?v=abc12345678'), 'youtube', 'no-www youtube.com')
eq(detectProvider('http://youtube.com/watch?v=abc12345678'), 'youtube', 'http youtube.com')
eq(detectProvider('https://www.youtube.com/watch?v=abc12345678'), 'youtube', 'www youtube.com')
eq(detectProvider('https://m.youtube.com/watch?v=abc12345678'), 'youtube', 'm.youtube.com')
eq(
  detectProvider('https://music.youtube.com/watch?v=abc12345678'),
  'youtube',
  'music subdomain youtube'
)
eq(detectProvider('https://www.youtube.com/embed/abc12345678'), 'youtube', 'embed URL')
eq(detectProvider('https://www.youtube.com/shorts/abc12345678'), 'youtube', 'shorts URL')
eq(detectProvider('https://vimeo.com/123456'), 'vimeo', 'no-www vimeo.com')
eq(detectProvider('https://www.vimeo.com/123456'), 'vimeo', 'www vimeo.com')
eq(detectProvider('https://player.vimeo.com/video/123456'), 'vimeo', 'player subdomain vimeo')
eq(detectProvider('https://cdn.example.com/a.mp4'), 'direct', 'CDN media URL stays direct')
eq(detectProvider('not a url'), 'direct', 'unparseable input never throws')
eq(detectProvider(''), 'direct', 'empty input never throws')

// Unlisted Vimeo videos carry a hash after the id; without it as `h`,
// player.vimeo.com 403s the embed.
const hashed = vimeoEmbedUrl('https://vimeo.com/1223535680/50cb341467', false)
ok(hashed.includes('h=50cb341467'), `unlisted hash forwarded as h= (got "${hashed}")`)
ok(hashed.includes('player.vimeo.com/video/1223535680'), `unlisted id preserved (got "${hashed}")`)

const plain = vimeoEmbedUrl('https://vimeo.com/123456', false)
ok(!plain.includes('h='), `plain Vimeo URL carries no h= param (got "${plain}")`)
ok(plain.includes('player.vimeo.com/video/123456'), `plain Vimeo id preserved (got "${plain}")`)

console.log('videoProvider.selfcheck: OK')
