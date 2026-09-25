// Pure presentation maths for the anonymous doubt-seed gallery (HLN-003).
//
// No React, no DOM, no Firebase — the parts worth testing (card-id resolution,
// the anonymous labelling scheme, the generic-vs-souled contrast) live here so
// checks/phases/minigames/doubt_seed_gallery.selfcheck.ts can exercise them.
//
// The gallery is the L2 "7. Galeri" storyboard beat: one GENERIC AI description
// is shown next to the teams' own card arrangements, so the room sees the
// contrast without any name or score attached. Host curation lives here too:
// the host pins 2–3 entry keys to the central screen (toggleSpotlight /
// pinnedGallery), and with nothing pinned the central rotates through pages
// instead (see board.tsx).
import type { DoubtSeedConfig } from './score'

/** One curatable unit: a team in team modes, a player in individual sessions. */
export type GalleryEntry = { key: string; writerId: string }

/**
 * `key` is the `GalleryEntry` this card came from, so the host's pinned subset
 * can be picked out of the same labelled list the rotation renders — the label
 * itself stays positional over *submitted* entries (see
 * submittedGalleryEntries) and is NOT renumbered when the host pins a subset.
 */
export type GalleryCardEntry = { key: string; label: string; cards: string[] }

/**
 * How many versions the host may pin to the central screen at once. The
 * storyboard fixes the curation as "2–3 versi paling kontras"; three is that
 * upper bound, and it is also what keeps each version readable from the back
 * of the room (the same reason PAGE_CAPACITY is 3 in board.tsx).
 */
export const GALLERY_SPOTLIGHT_CAP = 3

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
 *
 * `playerIds` is just the participant id set (the caller derives it from
 * presence for host/central, from playerOwners for a player's own screen —
 * this only ever needs the keys, never a name).
 */
export function galleryEntries(
  phase: { teamMode?: string },
  teams: Array<{ id: string; ownerPlayerId: string; createdAt?: number }>,
  playerIds: string[]
): GalleryEntry[] {
  const isTeamMode =
    phase.teamMode === 'team_leader_only' || phase.teamMode === 'team_collaborative'
  if (isTeamMode) {
    return [...teams]
      .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
      .map((t) => ({ key: t.id, writerId: t.ownerPlayerId }))
  }
  return playerIds.map((id) => ({ key: id, writerId: id }))
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
    out.push({
      key: entry.key,
      label: galleryLabel(out.length),
      cards: value.map((id) => index[id] ?? id),
    })
  })
  return out
}

/**
 * Add or remove one key from the host's pinned list, never mutating the input.
 *
 * At `cap` an add is a no-op rather than an error: the host UI disables the
 * 4th chip, so reaching this is a race (two hosts, or a stale render) and the
 * safe answer is to keep the curation the room is already looking at. Removing
 * is always allowed, which is the only way back under the cap.
 */
export function toggleSpotlight(
  keys: string[],
  key: string,
  cap: number = GALLERY_SPOTLIGHT_CAP
): string[] {
  if (keys.includes(key)) return keys.filter((k) => k !== key)
  if (keys.length >= cap) return keys
  return [...keys, key]
}

/**
 * The host's pinned subset, in pin order.
 *
 * Pin order — not submission order — is what the host chose ("these two
 * contrast the most"), so the pair stays side by side in the order it was
 * picked. Keys that no longer resolve to a submitted entry are dropped rather
 * than rendered as an empty slot; an empty result means "nothing pinned is on
 * the wall", which callers treat as "fall back to the rotation".
 */
export function pinnedGallery(entries: GalleryCardEntry[], keys: string[]): GalleryCardEntry[] {
  const byKey = new Map(entries.map((e) => [e.key, e]))
  const out: GalleryCardEntry[] = []
  for (const key of keys) {
    const entry = byKey.get(key)
    if (entry) out.push(entry)
  }
  return out
}
