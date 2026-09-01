// Short generated chime for scan correct/wrong feedback — no bundled audio
// asset, no dependency, just the Web Audio API. Rising two-tone for correct,
// a single low tone for wrong.
let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') return null
  if (!ctx) ctx = new AudioContext()
  return ctx
}

function beep(freqs: number[], noteSeconds: number) {
  const audioCtx = getContext()
  if (!audioCtx) return
  void audioCtx.resume()
  const now = audioCtx.currentTime
  freqs.forEach((freq, i) => {
    const start = now + i * noteSeconds
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.15, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + noteSeconds)
    osc.connect(gain).connect(audioCtx.destination)
    osc.start(start)
    osc.stop(start + noteSeconds)
  })
}

export function playCorrectSound() {
  beep([660, 990], 0.12)
}

export function playWrongSound() {
  beep([220], 0.25)
}
