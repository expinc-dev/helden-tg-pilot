import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectDatabaseEmulator, getDatabase, ref } from 'firebase/database'
import { getFirestore } from 'firebase/firestore'

import { demoBundle } from './demoBundle'

// tg-pilot is the runtime — Firestore (bundle + archive) + RTDB (live state).
// The CMS never touches RTDB; this repo is where it comes in.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL as string,
}

export const app = initializeApp(firebaseConfig)
export const firestore = getFirestore(app)
export const rtdb = getDatabase(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// This deploy plays exactly ONE event; its id comes from the pasted bundle
// (games/{eventId} → PublishedGame.gameId). Every live-session path is namespaced
// under events/{EVENT_ID}/ so one client's RTDB holds many events side by side,
// each in its own subtree. Use eref() for all live-session refs; the bare rtdb
// root is only for the emulator wiring below.
export const EVENT_ID = demoBundle.gameId
export const eref = (path: string) => ref(rtdb, `events/${EVENT_ID}/${path}`)

// Gated behind an explicit flag (only set in .env.e2e) so a misconfigured real
// .env can never silently redirect production writes at a local emulator.
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectDatabaseEmulator(rtdb, '127.0.0.1', 9000)
}
