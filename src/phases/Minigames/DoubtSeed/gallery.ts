// Pure presentation maths for the anonymous doubt-seed gallery (HLN-003).
//
// No React, no DOM, no Firebase — the parts worth testing (card-id resolution,
// the anonymous labelling scheme, the generic-vs-souled contrast) live here so
// checks/phases/minigames/doubt_seed_gallery.selfcheck.ts can exercise them.
//
// The gallery is the L2 "7. Galeri" storyboard beat: one GENERIC AI description
// is shown next to the teams' own card arrangements, so the room sees the
// contrast without any name or score attached. Host curation is deliberately
// NOT modelled here — the central rotates through pages instead (see central.tsx),
// which needs no new RTDB node and therefore no new security rule.
import type { DoubtSeedConfig } from './score'

/** One curatable unit: a team in team modes, a player in individual sessions. */
export type GalleryEntry = { key: string; writerId: string }

export type GalleryCardEntry = { label: string; cards: string[] }

/**
 * The comparison text the storyboard fixes verbatim (Story.md "Langkah 1 —
 * Baca versi AI"). Shared by the central panel and the self-check so the two
 * cannot drift.
 */
export const GENERIC_VERSION_TEXT =
  'Usaha kami menyediakan produk berkualitas dengan harga terjangkau. Dibuat dengan bahan pilihan dan pelayanan ramah. Kepuasan pelanggan prioritas kami. Pesan sekarang dan rasakan bedanya!'

export const GENERIC_VERSION_CAPTION = 'Bisa jadi toko siapa saja.'

/**
 * Resolve a submitted card id back to its text. Seeds are handed to the player
 * as one shuffled pool (`doubtSeed/player.tsx`), so an answer may mix soul and
 * distractor ids — both are indexed here. An unknown id degrades to the raw id
 * rather than vanishing, so a config that dropped a card mid-session still
 * shows something instead of a silent gap.
 */
export function cardTextIndex(config: DoubtSeedConfig): Record<string, string> {
  const index: Record<string, string> = {}
  for (const card of [...config.soulCards, ...config.distractorCards]) index[card.id] = card.text
  return index
}

/**
 * Anonymous label for the entry at `index`. Positional on purpose: the whole
 * point of the gallery is that nothing here identifies a team, so `teamName`
 * must never reach this screen either (HLN-003 AC "No names shown anywhere").
 */
export function galleryLabel(index: number): string {
  return `Tim ${String.fromCharCode(65 + index)}`
}

/**
 * Which sessions participate, in label order. `key` is stable identity for
 * React; `writerId` is whose `players/{id}/answers/{phaseId}` node holds the
 * submission — the team's leader in team modes, the player themselves in
 * individual sessions (the same split `doubtSeed/player.tsx` writes through).
 */
export function galleryEntries(
  phase: { teamMode?: string },
  teams: Array<{ id: string; ownerPlayerId: string; createdAt?: number }>,
  players: Record<string, unknown>
): GalleryEntry[] {
  const isTeamMode =
    phase.teamMode === 'team_leader_only' || phase.teamMode === 'team_collaborative'
  if (isTeamMode) {
    return [...teams]
      .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
      .map((t) => ({ key: t.id, writerId: t.ownerPlayerId }))
  }
  return Object.keys(players).map((id) => ({ key: id, writerId: id }))
}

/**
 * Progressive reveal: a team appears as soon as its arrangement lands. Entries
 * with nothing to show yet are dropped, so the room sees the gallery fill up
 * instead of a wall of placeholders. An empty `cards` array (including one
 * whose ids all failed to resolve) counts as "nothing to show".
 */
export function submittedGalleryEntries(
  entries: GalleryEntry[],
  answers: Record<string, { value: string[] } | undefined>,
  index: Record<string, string>
): GalleryCardEntry[] {
  const out: GalleryCardEntry[] = []
  entries.forEach((entry) => {
    const value = answers[entry.writerId]?.value
    if (!Array.isArray(value) || value.length === 0) return
    out.push({ label: galleryLabel(out.length), cards: value.map((id) => index[id] ?? id) })
  })
  return out
}
