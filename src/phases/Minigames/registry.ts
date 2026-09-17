import { AnalyzeGridRenderer } from './AnalyzeGrid'
import { analyzeGridConfigSchema, scoreAnalyzeGrid } from './AnalyzeGrid/score'
import { DoubtSeedRenderer } from './DoubtSeed'
import { doubtSeedConfigSchema, scoreDoubtSeed } from './DoubtSeed/score'
import { SortOrderRenderer } from './SortOrder'
import { scoreSortOrder, sortOrderConfigSchema } from './SortOrder/score'
import { TeamSelfieRenderer } from './TeamSelfie'
import { scoreTeamSelfie, teamSelfieConfigSchema } from './TeamSelfie/score'
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
  {
    templateId: 'analyze_grid',
    configSchema: analyzeGridConfigSchema,
    Renderer: AnalyzeGridRenderer,
    scorer: scoreAnalyzeGrid,
  },
  {
    templateId: 'doubt_seed',
    configSchema: doubtSeedConfigSchema,
    Renderer: DoubtSeedRenderer,
    scorer: scoreDoubtSeed,
  },
  {
    templateId: 'team_selfie',
    configSchema: teamSelfieConfigSchema,
    Renderer: TeamSelfieRenderer,
    scorer: scoreTeamSelfie,
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
