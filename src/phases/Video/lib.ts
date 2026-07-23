export function detectProvider(url: string): 'vimeo' | 'youtube' | 'direct' {
  if (/(?:^|\.)vimeo\.com\//.test(url)) return 'vimeo'
  if (/(?:^|\.)youtube\.com\/|(?:^|\.)youtu\.be\//.test(url)) return 'youtube'
  return 'direct'
}

export function vimeoEmbedUrl(url: string, muted: boolean): string {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (!m) return url
  const id = m[1]
  const params = new URLSearchParams({
    api: '1',
    background: '0',
    autoplay: '0',
    muted: muted ? '1' : '0',
    controls: '0',
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

export function youtubeEmbedUrl(url: string, muted: boolean): string {
  const id = youtubeVideoId(url)
  if (!id) return url
  const params = new URLSearchParams({
    enablejsapi: '1',
    autoplay: '0',
    mute: muted ? '1' : '0',
    controls: '0',
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
