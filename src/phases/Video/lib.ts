export function detectProvider(url: string): 'vimeo' | 'direct' {
  return /(?:^|\.)vimeo\.com\//.test(url) ? 'vimeo' : 'direct'
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

export function fmtTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
