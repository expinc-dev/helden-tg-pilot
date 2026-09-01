import jsQR from 'jsqr'

// BarcodeDetector isn't in TS's lib.dom.d.ts yet (Chrome/Edge/Safari 17+ ship
// it natively; Firefox doesn't) — minimal ambient type for the one method used.
declare global {
  interface BarcodeDetectorOptions {
    formats: string[]
  }
  interface DetectedBarcode {
    rawValue: string
  }
  class BarcodeDetector {
    constructor(options?: BarcodeDetectorOptions)
    detect(source: ImageData): Promise<DetectedBarcode[]>
  }
}

let nativeDetector: BarcodeDetector | null | undefined

function getNativeDetector(): BarcodeDetector | null {
  if (nativeDetector !== undefined) return nativeDetector
  nativeDetector =
    typeof BarcodeDetector !== 'undefined' ? new BarcodeDetector({ formats: ['qr_code'] }) : null
  return nativeDetector
}

// Decodes a QR code from a captured camera frame. Tries the native
// BarcodeDetector API first, falls back to jsQR (pure JS, works everywhere)
// when it's unavailable or fails to find anything.
export async function decodeQr(imageData: ImageData): Promise<string | null> {
  const native = getNativeDetector()
  if (native) {
    try {
      const results = await native.detect(imageData)
      if (results[0]) return results[0].rawValue
    } catch {
      // fall through to jsQR
    }
  }
  const result = jsQR(imageData.data, imageData.width, imageData.height)
  return result?.data ?? null
}
