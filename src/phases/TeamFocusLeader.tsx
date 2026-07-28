import { assets } from '@/assets'

// team_leader_only, rendered for a "member": no input UI at all — only the
// leader acts in this mode, so a member's device should not show the phase's
// own renderer (BLUEPRINT_runtime §7 extension: reconnect must land a member
// back on THIS, not stuck on stale local state or an interactive control they
// can't use). Mirrors Idle's PlayerIdleScreen visual language on purpose —
// this IS an idle state for this device, just phase-specific in its caption.
// Self-contained background (not just a color) since several of this
// component's callers (codeinput, minigames) bypass the page shell's own
// background to own their full screen — this can't rely on an ambient one.
export function TeamFocusLeader({ phaseId }: { phaseId: string }) {
  return (
    <div
      className="relative flex min-h-dvh w-full flex-col items-center justify-center gap-4 bg-neutral-950 bg-cover bg-center p-6 text-center"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.player})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <div className="text-5xl">👀</div>
      <h1
        className="max-w-xs text-2xl font-bold text-white"
        style={{ textShadow: '0 0 16px rgba(255, 255, 255, 0.4)' }}
      >
        Your team leader is working on this — watch their screen.
      </h1>
      <p className="rounded-full bg-white/5 px-4 py-2 text-xs text-white/40">member · {phaseId}</p>
    </div>
  )
}
