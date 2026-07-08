import { Link, Navigate, Route, Routes } from 'react-router-dom'

import { CentralView } from './roles/central/CentralView'
import { HostNew } from './roles/host/HostNew'
import { HostView } from './roles/host/HostView'
import { PlayerView } from './roles/player/PlayerView'
import { JoinGate } from './session/JoinGate'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/host/new" element={<HostNew />} />
      <Route path="/host/:sessionId" element={<HostView />} />
      <Route path="/central/:sessionId" element={<CentralView />} />
      <Route path="/player/:sessionId" element={<PlayerView />} />
      <Route path="/join/:role" element={<JoinGate />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function Landing() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Helden TG Pilot</h1>
      <div className="flex gap-4 text-sm">
        <Link className="underline" to="/host/new">
          Host: new session
        </Link>
        <Link className="underline" to="/join/central">
          Join as central
        </Link>
        <Link className="underline" to="/join/player">
          Join as player
        </Link>
      </div>
    </div>
  )
}
