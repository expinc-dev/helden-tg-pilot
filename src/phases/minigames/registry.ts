import { SortOrderRenderer } from './sort_order'
import { scoreSortOrder, sortOrderConfigSchema } from './sort_order.score'
import type { MinigameTemplate } from './types'

// The registry: templateId → template code. Add a new template by importing
// its Renderer + score module and appending an entry. Registration is by
// array (not side-effect self-register) so the known-templates set is grep-able
// and tree-shakes cleanly. Unknown templateId → get() returns undefined →
// PhaseRouter renders <UnknownTemplate>.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTemplate = MinigameTemplate<any>

const templates: AnyTemplate[] = [
  {
    templateId: 'sort_order',
    configSchema: sortOrderConfigSchema,
    Renderer: SortOrderRenderer,
    scorer: scoreSortOrder,
  },
]
const byId = new Map<string, AnyTemplate>(templates.map((t) => [t.templateId, t]))

export const minigameRegistry = {
  get(templateId: string): AnyTemplate | undefined {
    return byId.get(templateId)
  },
  ids(): string[] {
    return [...byId.keys()]
  },
}
