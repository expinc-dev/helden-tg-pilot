// Selfie image compression (HLN-018).
//
// v1 stores the photo as a base64 data URL inside the RTDB node
// `sessions/{id}/selfies/{teamId}/image` — the Firebase project runs on the
// Spark plan, which has no Cloud Storage, and the pilot has no CDN upload
// credentials in its env. That makes size the single most important property
// here: RTDB rejects anything above ~400 KB per string write (enforced by
// database.rules.json), and a raw phone frame is several MB as base64.
//
// So: downscale to a bounded box and re-encode as JPEG at a modest quality.
// A 800 px, q0.6 selfie lands around 60–100 KB, comfortable under the cap.

export interface CompressOptions {
  /** Longest edge of the output, in px. Aspect ratio is preserved. */
  maxPx: number
  /** JPEG quality, 0–1. */
  quality: number
  /**
   * Flip horizontally before encoding. The front camera preview is CSS-mirrored
   * (`scale-x-[-1]`), so the captured frame must be mirrored to match what the
   * player just saw — an un-mirrored selfie reads as "wrong" to them.
   */
  mirror?: boolean
}

export const DEFAULT_COMPRESS: CompressOptions = { maxPx: 800, quality: 0.6 }

/**
 * Fit `width` × `height` inside a `maxPx` box, preserving aspect ratio and
 * never upscaling. Pure — the geometry is unit-testable without a canvas,
 * which is why it lives here instead of inline in the capture component.
 */
export function fitWithin(
  width: number,
  height: number,
  maxPx: number
): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 }
  if (maxPx <= 0) return { width: 0, height: 0 }
  const longest = Math.max(width, height)
  if (longest <= maxPx) return { width: Math.round(width), height: Math.round(height) }
  const scale = maxPx / longest
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

/**
 * Draw `source` (a <video> or <canvas>) into an offscreen canvas scaled to fit
 * `opts.maxPx`, then return a JPEG data URL.
 *
 * Returns `null` when the browser refuses to produce an encoding (no 2d
 * context, or the source has no pixels yet) — callers treat that as "capture
 * failed, let the player retake" rather than crashing the phase.
 */
export function compressToJpegDataUrl(
  source: HTMLVideoElement | HTMLCanvasElement,
  opts: CompressOptions = DEFAULT_COMPRESS
): string | null {
  const sw = source instanceof HTMLVideoElement ? source.videoWidth : source.width
  const sh = source instanceof HTMLVideoElement ? source.videoHeight : source.height
  if (!sw || !sh) return null

  const { width, height } = fitWithin(sw, sh, opts.maxPx)
  if (!width || !height) return null

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  if (opts.mirror) {
    ctx.translate(width, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(source, 0, 0, width, height)

  const url = canvas.toDataURL('image/jpeg', opts.quality)
  // toDataURL silently falls back to "data:," for an empty canvas.
  return url.startsWith('data:image/') ? url : null
}
