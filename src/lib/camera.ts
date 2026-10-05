// Camera access helpers shared by the selfie capture and the QR / pattern
// scanner.
//
// `navigator.mediaDevices` only exists in a secure context (HTTPS or
// localhost). A pilot served over LAN HTTP (a phone hitting the host's IP)
// has it `undefined`, so `navigator.mediaDevices.getUserMedia(...)` throws a
// TypeError inside an effect — which unmounted the whole React tree and left
// the player on a blank white page. Callers check `hasLiveCamera()` first and
// fall back to the device's own camera app through
// `<input type="file" capture>`, which works over plain HTTP.

export function hasLiveCamera(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
}

// Decode a photo taken through `<input type="file" capture>` into a canvas,
// honouring the EXIF orientation so portrait phone photos are not rotated.
export async function fileToCanvas(file: File): Promise<HTMLCanvasElement | null> {
  // Preferred: createImageBitmap with the EXIF orientation applied. Older
  // browsers (iOS < 17) reject the options bag, so retry without it, then fall
  // back to an <img> + object URL (browsers apply EXIF orientation to <img>).
  const draw = (src: CanvasImageSource, w: number, h: number) => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(src, 0, 0, w, h)
    return canvas
  }
  for (const opts of [{ imageOrientation: 'from-image' as const }, undefined]) {
    try {
      const bitmap = await createImageBitmap(file, opts)
      const canvas = draw(bitmap, bitmap.width, bitmap.height)
      bitmap.close()
      if (canvas) return canvas
    } catch {
      // try the next strategy
    }
  }
  try {
    const url = URL.createObjectURL(file)
    try {
      const img = new Image()
      img.src = url
      await img.decode()
      return draw(img, img.naturalWidth, img.naturalHeight)
    } finally {
      URL.revokeObjectURL(url)
    }
  } catch {
    return null
  }
}
