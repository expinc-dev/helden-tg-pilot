// Safe fallback for unknown or invalid-config minigame templates
// (BLUEPRINT_runtime §9: "unknown templateId renders a safe fallback").
// Fires when: templateId not in the registry, OR the phase's config fails the
// template's Zod schema. Message intentionally boring — nothing the trainee can
// do about it live; the actionable feedback is "update the app / republish".
export function UnknownTemplate({ templateId, reason }: { templateId: string; reason?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 p-8 text-center">
      <p className="text-lg font-medium text-gray-700">
        This mini-game can't be played on this version.
      </p>
      <p className="text-sm text-gray-500">Please update the app.</p>
      <p className="mt-4 font-mono text-xs text-gray-400">
        templateId: {templateId}
        {reason ? ` · ${reason}` : ''}
      </p>
    </div>
  )
}
