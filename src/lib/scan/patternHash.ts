// Difference hash (dHash): tolerant to lighting/scale/minor rotation, cheap
// (vanilla canvas, no library) — good enough for comparing a photographed
// physical puzzle against its authored reference image.
const HASH_WIDTH = 9 // 8 diff bits per row
const HASH_HEIGHT = 8

// Below this Hamming distance (out of 64 bits), two hashes are considered a
// match. Tunable — needs real-device calibration once this is testable
// on an actual phone camera (see helden-tg-pilot/todo.md).
export const MATCH_THRESHOLD = 12

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

// Resizes to a 9x8 grayscale grid, compares each pixel to its right
// neighbor — 64 comparison bits packed into a bigint.
export function computeDHash(source: HashSource): bigint {
  const gray = toGrayscaleResized(source, HASH_WIDTH, HASH_HEIGHT)
  let hash = 0n
  for (let y = 0; y < HASH_HEIGHT; y++) {
    for (let x = 0; x < HASH_WIDTH - 1; x++) {
      const left = gray[y * HASH_WIDTH + x]
      const right = gray[y * HASH_WIDTH + x + 1]
      hash = (hash << 1n) | (left > right ? 1n : 0n)
    }
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
