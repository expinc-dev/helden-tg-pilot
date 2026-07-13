import { Link, Navigate, Route, Routes } from 'react-router-dom'

import { TabletFrame } from './components/TabletFrame'
import { useAuthUid } from './lib/useAuthUid'
import { CentralView } from './pages/central/screen'
import { JoinGate } from './pages/extra/join'
import { HostView } from './pages/host/lobby'
import { HostNew } from './pages/host/new'
import { PlayerView } from './pages/player/play'

export function App() {
  // Every route below eventually writes to RTDB, and every write is now gated
  // by database.rules.json on auth.uid — block routing until that resolves so
  // no view races ahead and gets a permission-denied from rules instead of a
  // clear "signing in" state.
  const { uid, error } = useAuthUid()
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-sm text-red-600">Couldn't sign in: {error}</p>
        <p className="max-w-md text-xs text-gray-500">
          Most likely cause: Anonymous sign-in isn't enabled for this Firebase project. Firebase
          Console → Authentication → Sign-in method → Anonymous → Enable, then reload this page.
        </p>
      </div>
    )
  }
  if (!uid) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <p className="text-sm text-gray-500">Signing in…</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/host/new"
        element={
          <TabletFrame>
            <HostNew />
          </TabletFrame>
        }
      />
      <Route
        path="/host/:sessionId"
        element={
          <TabletFrame>
            <HostView />
          </TabletFrame>
        }
      />
      <Route path="/central/:sessionId" element={<CentralView />} />
      <Route
        path="/player/:sessionId"
        element={
          <TabletFrame>
            <PlayerView />
          </TabletFrame>
        }
      />
      <Route
        path="/join/:role"
        element={
          <TabletFrame>
            <JoinGate />
          </TabletFrame>
        }
      />
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
