import { useCallback, useRef } from 'react'

import { MATCH_THRESHOLD, computeDHash, hammingDistance, loadImage } from '@/lib/scan/patternHash'
import { decodeQr } from '@/lib/scan/qrDetect'

export function useQrDetector(expectedValue: string) {
  return useCallback(
    async (frame: ImageData) => {
      const decoded = await decodeQr(frame)
      return decoded !== null && decoded === expectedValue
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
      if (!targetUrl) return false
      if (cacheRef.current?.url !== targetUrl) {
        const img = await loadImage(targetUrl)
        cacheRef.current = { url: targetUrl, hash: computeDHash(img) }
      }
      const frameHash = computeDHash(frame)
      return hammingDistance(frameHash, cacheRef.current.hash) <= MATCH_THRESHOLD
    },
    [targetUrl]
  )
}
