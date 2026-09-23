// Runnable self-check for detectProvider / vimeoEmbedUrl. No test runner / node
// types needed:
//   npx tsx checks/phases/videoProvider.selfcheck.ts
// Excluded from the app build (tsconfig.app.json includes only "src").
import {
  VIMEO_END_EVENT,
  detectProvider,
  vimeoEmbedUrl,
  youtubeEmbedUrl,
} from '../../src/phases/Video/lib'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}
const eq = (a: string, b: string, msg: string) => ok(a === b, `${msg} (got "${a}", want "${b}")`)

// Regression that produced the bug report: the bundled demo video was a bare
// youtu.be URL, which the old (?:^|\.)-anchored regex classified as 'direct'
// and handed to a native <video> element → NotSupportedError, silent no-play.
eq(
  detectProvider('https://youtu.be/FUKmyRLOlAA?si=-nRBmiIXdAkMhRe1'),
  'youtube',
  'bare youtu.be URL'
)
// The demo video the pilot actually ships (src/lib/demoBundle.ts). Unlisted
// and bare — no "www." — so it exercises both halves of the classifier fix.
eq(detectProvider('https://vimeo.com/1223535680/50cb341467'), 'vimeo', 'the bundled demo video URL')
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
// player.vimeo.com 403s the embed — Vimeo's own oEmbed response puts it in the
// iframe src too. This is the shipped demo video, so the assertion is
// deliberately against its real (confirmed-live) id/hash.
const hashed = vimeoEmbedUrl('https://vimeo.com/1223535680/50cb341467', false)
ok(hashed.includes('h=50cb341467'), `unlisted hash forwarded as h= (got "${hashed}")`)
ok(hashed.includes('player.vimeo.com/video/1223535680'), `unlisted id preserved (got "${hashed}")`)
// The host screen drives playback over postMessage, so the embed must carry
// api=1 regardless of what the caller asked for.
ok(hashed.includes('api=1'), `api=1 present for postMessage control (got "${hashed}")`)

const plain = vimeoEmbedUrl('https://vimeo.com/123456', false)
ok(!plain.includes('h='), `plain Vimeo URL carries no h= param (got "${plain}")`)
ok(plain.includes('player.vimeo.com/video/123456'), `plain Vimeo id preserved (got "${plain}")`)

// The host screen drives YouTube playback (play/pause/seek) and detects the
// end of the video — which is what enables "Tahap selanjutnya" — entirely over
// the IFrame API's postMessage channel. That channel only exists if the embed
// carries enablejsapi=1, so it must never be dropped.
const yt = youtubeEmbedUrl('https://youtu.be/FUKmyRLOlAA?si=-nRBmiIXdAkMhRe1', true)
ok(yt.includes('youtube.com/embed/FUKmyRLOlAA'), `youtu.be id becomes embed URL (got "${yt}")`)
ok(yt.includes('enablejsapi=1'), `enablejsapi=1 present (got "${yt}")`)
ok(yt.includes('controls=0'), `native chrome hidden by default (got "${yt}")`)
ok(yt.includes('mute=1'), `muted embed requested (got "${yt}")`)

const ytUnmuted = youtubeEmbedUrl('https://www.youtube.com/watch?v=FUKmyRLOlAA', false)
ok(ytUnmuted.includes('mute=0'), `unmuted embed requested (got "${ytUnmuted}")`)
ok(
  ytUnmuted.includes('youtube.com/embed/FUKmyRLOlAA'),
  `watch URL id preserved (got "${ytUnmuted}")`
)

const ytOptedIn = youtubeEmbedUrl('https://youtu.be/FUKmyRLOlAA', false, { controls: true })
ok(ytOptedIn.includes('controls=1'), `opts.controls opt-in re-enables chrome (got "${ytOptedIn}")`)

// The reported bug: the end-of-playback subscription used 'finish', which
// @vimeo/player never emits (the name is forwarded verbatim to the embed and
// no 'finish' alias exists), so onEnded never fired and "Tahap selanjutnya"
// stayed disabled after the video ended. Pin the real event name.
eq(VIMEO_END_EVENT, 'ended', 'Vimeo end event is the emitted name, not legacy finish')

console.log('videoProvider.selfcheck: OK')
