import { useParams } from 'react-router-dom'

import { useSessionConfig } from './useSession'

// No-arg game-type hook. Pulls the current sessionId off the router (every
// live screen is inside a route with :sessionId), reads config.allowTeams
// from RTDB via useSessionConfig, and derives the display string. Callable
// from any component inside <Router>.
export function useGameType(): 'Multiplayer Game' | 'Singleplayer Game' {
  const { sessionId } = useParams<{ sessionId: string }>()
  const config = useSessionConfig(sessionId)
  return config?.allowTeams ? 'Multiplayer Game' : 'Singleplayer Game'
}
