// One-time audio permission unlock. Modern browsers block programmatic
// <video>/<audio>.play() with sound until the document has received a user
// gesture; play attempts triggered later by an RTDB listener (e.g. host
// clicks Play → central listener fires) don't count as a gesture.
//
// Called during central's Join click handler — the click IS a user gesture,
// so a play attempt in that scope gets to complete. Once done, the tab has
// "user activation" and subsequent programmatic play() calls with sound
// succeed for the rest of the session (per HTML spec's sticky-activation).
//
// Vimeo iframes have their OWN autoplay policy inside the iframe and this
// unlock doesn't bypass it — a fallback overlay would be needed for Vimeo
// audio on truly-cold central loads. Direct <video> is covered.
export async function unlockAudio(): Promise<void> {
  try {
    // 1-sample silent WAV as a data URI — no network fetch, no bundled asset.
    const audio = new Audio(
      'data:audio/wav;base64,UklGRhwAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA='
    )
    audio.volume = 0
    await audio.play()
    audio.pause()
  } catch {
    // Best-effort. If this ever fails, central falls back to muted-first
    // playback which browsers always allow.
  }
}
