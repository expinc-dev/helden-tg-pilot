// Average hash (aHash): each grid cell compared to the image's own mean
// brightness, not to a neighbor pixel. Switched from dHash (gradient-based)
// because sharp diagonal cuts in this pattern's flat two-tone art shift
// which grid column a boundary falls into on downsampling, flipping many
// gradient bits even when the photo visually matches — dHash is tuned for
// photographic content, not hard-edged line art. aHash only cares whether a
// region is mostly-black or mostly-white, so minor misalignment matters far
// less. Still vanilla canvas, no library.
const HASH_SIZE = 16 // 16x16 grid = 256 bits, finer than the old 9x8 (only
// ~2 samples per tile column across this pattern's 4-column grid)

// Below this Hamming distance (out of 256 bits), two hashes are considered a
// match. ScannerPopup crops the capture to its centered guide box, so this
// only has to absorb lighting/scale/minor-rotation noise, not framing
// mismatch — but the number itself is still a guess. Tunable — needs
// real-device calibration once this is testable on an actual phone camera
// (see helden-tg-pilot/todo.md).
export const MATCH_THRESHOLD = 40

// A captured camera frame arrives as raw ImageData (from canvas
// getImageData), not a drawImage-able CanvasImageSource — normalize it onto
// a scratch canvas first so both input kinds go through the same resize path.
export type HashSource = CanvasImageSource | ImageData

function toGrayscaleResized(source: HashSource, width: number, height: number): Uint8ClampedArray {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')

  if (source instanceof ImageData) {
    const scratch = document.createElement('canvas')
    scratch.width = source.width
    scratch.height = source.height
    const scratchCtx = scratch.getContext('2d')
    if (!scratchCtx) throw new Error('2D canvas context unavailable')
    scratchCtx.putImageData(source, 0, 0)
    ctx.drawImage(scratch, 0, 0, width, height)
  } else {
    ctx.drawImage(source, 0, 0, width, height)
  }

  const { data } = ctx.getImageData(0, 0, width, height)
  const gray = new Uint8ClampedArray(width * height)
  for (let i = 0; i < gray.length; i++) {
    gray[i] = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3
  }
  return gray
}

// Resizes to a 16x16 grayscale grid, compares each cell to the grid's own
// mean brightness — 256 comparison bits packed into a bigint.
export function computeHash(source: HashSource): bigint {
  const gray = toGrayscaleResized(source, HASH_SIZE, HASH_SIZE)
  const mean = gray.reduce((sum, v) => sum + v, 0) / gray.length
  let hash = 0n
  for (let i = 0; i < gray.length; i++) {
    hash = (hash << 1n) | (gray[i] > mean ? 1n : 0n)
  }
  return hash
}

export function hammingDistance(a: bigint, b: bigint): number {
  let diff = a ^ b
  let count = 0
  while (diff > 0n) {
    count += Number(diff & 1n)
    diff >>= 1n
  }
  return count
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    img.src = url
  })
}
