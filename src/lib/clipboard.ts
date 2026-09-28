import { toast } from 'sonner'

// ponytail: `navigator.clipboard.writeText` is secure-context-only (HTTPS or
// localhost) — same trap as `crypto.subtle` we already dodge in lib/ids.ts.
// Sessions demoed over LAN HTTP (a tablet + phones on wifi hitting the host's
// IP) land in insecure context, where the property is `undefined`. Fall back
// to the legacy `execCommand('copy')` there — deprecated but still works in
// every browser we ship to, and needs no user permission prompt. Upgrade path:
// once the pilot is only ever served over HTTPS, drop the fallback.
export async function copyToClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      if (!ok) throw new Error('execCommand copy returned false')
    }
    toast.success('Disalin ke clipboard')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    toast.error(`Gagal menyalin: ${msg}`)
  }
}
