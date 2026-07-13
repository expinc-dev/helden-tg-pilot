import { useCallback, useEffect, useState } from 'react'

// Native Fullscreen API, wrapped as a hook. Call toggle()/enter()/exit() from
// any component; read isFullscreen to swap the expand/collapse icon. Targets the
// whole document, so it works the same from every page. Multiple callers stay in
// sync because they all listen to the same global fullscreenchange event.
//
// Safari (incl. iPadOS) only exposes the webkit-prefixed names, so both are
// handled. iPhone Safari has no element Fullscreen API at all — toggle() is then
// a no-op and isFullscreen stays false, which the icon should treat as "can't".
type FsDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
}
type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
}

function fsElement(): Element | null {
  return document.fullscreenElement ?? (document as FsDocument).webkitFullscreenElement ?? null
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(() => !!fsElement())

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!fsElement())
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  const enter = useCallback(() => {
    const el = document.documentElement as FsElement
    const fn = el.requestFullscreen ?? el.webkitRequestFullscreen
    if (fn) void Promise.resolve(fn.call(el)).catch(() => {})
  }, [])

  const exit = useCallback(() => {
    const d = document as FsDocument
    const fn = document.exitFullscreen ?? d.webkitExitFullscreen
    if (fn) void Promise.resolve(fn.call(document)).catch(() => {})
  }, [])

  const toggle = useCallback(() => {
    if (fsElement()) exit()
    else enter()
  }, [enter, exit])

  return { isFullscreen, enter, exit, toggle }
}
