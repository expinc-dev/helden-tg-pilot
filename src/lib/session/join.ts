import { get } from 'firebase/database'

import { eref } from '@/lib/firebase'

export async function resolveJoinCode(code: string): Promise<string | null> {
  const snap = await get(eref(`joinCodes/${code.toUpperCase()}`))
  return snap.exists() ? (snap.val() as string) : null
}
