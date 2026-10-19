import { useEffect, useState } from 'react'

import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'

import { auth } from './firebase'

// Every role needs a REAL, server-issued uid before touching RTDB — everything
// in database.rules.json that says "only the owner may write X" is checking
// this. Without it, `auth.uid` is always null and every ownership rule reduces
// to "nobody can write anything," which is why this must resolve before any
// join/create/presence call, not lazily alongside it.
//
// signInAnonymously() when already signed in is a no-op that resolves with the
// SAME uid (Firebase persists the anonymous session locally) — so a refreshed
// tab reliably gets back the same uid, which is exactly what lets a rejoin's
// ownership check pass without any extra code.
export type AuthState = { uid: string | null; error: string | null }

// One anonymous sign-in at a time. The "already signed in → same uid" guarantee
// above only holds AFTER the first sign-in has resolved. React StrictMode (dev)
// runs the effect below twice back to back; at the second run auth.currentUser is
// still null, so a second signInAnonymously() would mint a SECOND anonymous user.
// The page then claims ownership with the first uid while the RTDB connection ends
// up authenticated as the second, so the claim (and every owner-only write after
// it) is denied — the ownership map stays empty and the device looks "joined" but
// can write nothing. Sharing one in-flight promise keeps it to a single user.
let pendingSignIn: Promise<unknown> | null = null
function signInOnce(): Promise<unknown> {
  pendingSignIn ??= signInAnonymously(auth).finally(() => {
    pendingSignIn = null
  })
  return pendingSignIn
}

export function useAuthUid(): AuthState {
  const [state, setState] = useState<AuthState>({
    uid: auth.currentUser?.uid ?? null,
    error: null,
  })

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setState((s) => ({ uid: user?.uid ?? null, error: user ? null : s.error }))
    })
    if (!auth.currentUser) {
      void signInOnce().catch((e) => {
        // Most likely cause: Anonymous sign-in isn't enabled for this project —
        // Firebase Console → Authentication → Sign-in method → Anonymous → Enable.
        // Surfaced in the UI (App.tsx) instead of only devtools, so this doesn't
        // read as an unexplained infinite "Signing in…" hang.
        console.error('Anonymous sign-in failed — RTDB writes will be rejected by rules', e)
        setState((s) => ({ ...s, error: e instanceof Error ? e.message : String(e) }))
      })
    }
    return unsub
  }, [])

  return state
}
