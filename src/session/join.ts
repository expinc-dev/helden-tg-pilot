import { get, ref } from 'firebase/database'
import { rtdb } from '@/lib/firebase'

export async function resolveJoinCode(code: string): Promise<string | null> {
  const snap = await get(ref(rtdb, `joinCodes/${code.toUpperCase()}`))
  return snap.exists() ? (snap.val() as string) : null
}
