export function detectProvider(url: string): 'vimeo' | 'youtube' | 'direct' {
  // Parse the hostname instead of regex-matching the raw string — a plain
  // "https://vimeo.com/…" (no "www."/subdomain) has "vimeo.com" preceded by
  // "//", not "." or start-of-string, so the old (?:^|\.)vimeo\.com\/ regex
  // missed it and silently fell through to 'direct'. Tolerates URLs typed
  // without a protocol too (e.g. "vimeo.com/123").
  let host: string
  try {
    host = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`).hostname
  } catch {
    return 'direct'
  }
  if (host === 'vimeo.com' || host.endsWith('.vimeo.com')) return 'vimeo'
  if (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be')
    return 'youtube'
  return 'direct'
}

// opts defaults match the synced central/host players (no native controls,
// no autoplay — playback is driven by postMessage commands instead). Pass
// { controls: true } for an unsynced, standalone embed (e.g. a Block-level
// video with no watch-together state to drive).
export function vimeoEmbedUrl(
  url: string,
  muted: boolean,
  opts: { controls?: boolean; autoplay?: boolean } = {}
): string {
  // Unlisted/private Vimeo videos carry a hash after the numeric id
  // (".../1223535680/50cb341467") that must be forwarded as the `h` query
  // param — omit it and player.vimeo.com 403s the embed even though the id
  // itself is correct.
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?/)
  if (!m) return url
  const [, id, hash] = m
  const params = new URLSearchParams({
    api: '1',
    background: '0',
    autoplay: opts.autoplay ? '1' : '0',
    muted: muted ? '1' : '0',
    controls: opts.controls ? '1' : '0',
    ...(hash ? { h: hash } : {}),
  })
  return `https://player.vimeo.com/video/${id}?${params.toString()}`
}

function youtubeVideoId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

export function youtubeEmbedUrl(
  url: string,
  muted: boolean,
  opts: { controls?: boolean; autoplay?: boolean } = {}
): string {
  const id = youtubeVideoId(url)
  if (!id) return url
  const params = new URLSearchParams({
    enablejsapi: '1',
    autoplay: opts.autoplay ? '1' : '0',
    mute: muted ? '1' : '0',
    controls: opts.controls ? '1' : '0',
    playsinline: '1',
    rel: '0',
    origin: typeof window !== 'undefined' ? window.location.origin : '',
  })
  return `https://www.youtube.com/embed/${id}?${params.toString()}`
}

export function fmtTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
