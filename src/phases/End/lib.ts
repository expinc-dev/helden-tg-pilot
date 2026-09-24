import type { Phase } from '@helden-inc/tg-schema'

import type { Role } from '../PhaseRouter'

export type EndContent = Extract<Phase['content'], { type: 'end' }>

export type EndView = { title?: string; text?: string; imageUrl?: string }

// Only something that can actually be fetched goes into an <img src>.
// endContentSchema.imageMediaId holds a media-LIBRARY id (a UUID): the CMS's
// MediaPickerDialog stores the picked asset's id and nothing persists its url
// alongside it, so no mediaId→URL resolver exists in the pilot (compare image
// blocks, which carry both mediaId and url). Rendering the raw id would mean a
// broken-image icon on every end phase an author attached a picture to, so the
// field is treated as a URL that a media pipeline may one day provide and is
// inert until then — correct-by-construction, no wrong pixels today.
const isRenderableImage = (value: string | undefined): value is string =>
  !!value && /^(\/|https?:\/\/)/.test(value)

// Per-role resolution. endContentSchema and the CMS's EndEditor promise the
// same contract: perDevice !== true → every role sees the shared fields;
// perDevice === true → the role's own block, falling back FIELD BY FIELD to the
// shared value whenever that block omits it (the CMS surfaces exactly this as
// end.perDeviceHint / end.inheritedBadge).
export function resolveEndContent(content: EndContent, role: Role, phaseTitle: string): EndView {
  const roleFields = content.perDevice === true ? (content[role] ?? {}) : {}
  const title = roleFields.title ?? content.title ?? phaseTitle
  const text = roleFields.text ?? content.text
  const imageMediaId = roleFields.imageMediaId ?? content.imageMediaId

  return { title, text, imageUrl: isRenderableImage(imageMediaId) ? imageMediaId : undefined }
}
