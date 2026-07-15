import { useCallback, useState } from 'react'

import { OrientationContext } from './orientation'

// Refcounted: nothing prevents two components from opting out simultaneously
// (e.g., an overlay minigame layered above a landscape one). Count > 0 means
// "someone in the tree currently wants landscape allowed".
export function OrientationProvider({ children }: { children: React.ReactNode }) {
  const [allowedCount, setCount] = useState(0)
  const add = useCallback(() => setCount((n) => n + 1), [])
  const remove = useCallback(() => setCount((n) => Math.max(0, n - 1)), [])
  return (
    <OrientationContext.Provider value={{ allowedCount, add, remove }}>
      {children}
    </OrientationContext.Provider>
  )
}
