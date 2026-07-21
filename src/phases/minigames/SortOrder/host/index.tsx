import type { Phase } from '@helden-inc/tg-schema'

import { useTeams } from '@/lib/sync/useTeams'

import { useTeamSubmissions } from '../lib'

// Host's live view of who's still playing. Advancing the phase is already
// handled by the page shell's "Tahap Selanjutnya" button (host/lobby) — this
// only needs to surface progress, not own the advance action.
export function HostSortOrder({ sessionId, phase }: { sessionId: string; phase: Phase }) {
  const teams = useTeams(sessionId)
  const submitted = useTeamSubmissions(sessionId, teams, phase.id)
  const submittedCount = teams.filter((t) => submitted[t.id]).length

  return (
    <div className="flex flex-col gap-2 p-4">
      <p className="text-sm text-white/50">
        {submittedCount}/{teams.length} tim sudah mengirim jawaban
      </p>
      {teams.length === 0 && <p className="text-sm text-gray-400">Belum ada tim.</p>}
      {teams.map((team) => (
        <div
          key={team.id}
          className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm"
        >
          <span className="text-white/80">{team.teamName ?? 'Tim'}</span>
          <span className={submitted[team.id] ? 'font-semibold text-green-400' : 'text-white/40'}>
            {submitted[team.id] ? 'Terkirim ✓' : 'Menunggu…'}
          </span>
        </div>
      ))}
    </div>
  )
}
