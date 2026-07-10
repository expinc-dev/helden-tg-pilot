// team_leader_only, rendered for a "member": no input UI at all — only the
// leader acts in this mode, so a member's device should not show the phase's
// own renderer (BLUEPRINT_runtime §7 extension: reconnect must land a member
// back on THIS, not stuck on stale local state or an interactive control they
// can't use). Mirrors Idle's visual language on purpose — this IS an idle state
// for this device, just phase-specific in its caption.
export function TeamFocusLeader({ phaseId }: { phaseId: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16">
      <div className="text-4xl">👀</div>
      <p className="text-lg">Your team leader is working on this — watch their screen.</p>
      <p className="text-xs text-gray-400">member · {phaseId}</p>
    </div>
  )
}
