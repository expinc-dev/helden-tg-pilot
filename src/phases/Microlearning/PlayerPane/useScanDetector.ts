import { useCallback, useRef } from 'react'

import { MATCH_THRESHOLD, computeHash, hammingDistance, loadImage } from '@/lib/scan/patternHash'
import { decodeQr } from '@/lib/scan/qrDetect'

export function useQrDetector(expectedValue: string) {
  return useCallback(
    async (frame: ImageData) => {
      const decoded = await decodeQr(frame)
      return { matched: decoded !== null && decoded === expectedValue }
    },
    [expectedValue]
  )
}

// Loads + hashes the target reference image once per targetUrl (not once
// per attempt — a player may tap the shutter several times before matching).
export function usePatternDetector(targetUrl: string | undefined) {
  const cacheRef = useRef<{ url: string; hash: bigint } | null>(null)

  return useCallback(
    async (frame: ImageData) => {
      if (!targetUrl) return { matched: false }
      if (cacheRef.current?.url !== targetUrl) {
        const img = await loadImage(targetUrl)
        cacheRef.current = { url: targetUrl, hash: computeHash(img) }
      }
      const frameHash = computeHash(frame)
      const distance = hammingDistance(frameHash, cacheRef.current.hash)
      // ponytail: distance surfaced to the UI (ScanQuestion) purely for
      // real-device threshold calibration — drop this field once
      // MATCH_THRESHOLD is confirmed against real photos.
      return { matched: distance <= MATCH_THRESHOLD, distance }
    },
    [targetUrl]
  )
}
