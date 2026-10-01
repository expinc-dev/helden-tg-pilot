// Answer card with a lettered circle (A, B, C…). Yellow outline circle at rest;
// selected = yellow border, soft yellow tint and a filled circle. Shared by the
// microlearning question screen and the quiz player.
export function LetterOption({
  letter,
  label,
  selected,
  disabled,
  onClick,
  extra,
}: {
  letter: string
  label: string
  selected: boolean
  disabled: boolean
  onClick: () => void
  extra?: React.ReactNode
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-lg border px-4 py-4 transition"
      style={{
        borderColor: selected ? '#FDDB00' : '#99A3AE',
        background: selected
          ? 'linear-gradient(0deg, rgba(253, 219, 0, 0.16) 0%, rgba(253, 219, 0, 0.16) 100%), #1F1F1F'
          : '#1F1F1F',
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="flex w-full items-center gap-4 text-left text-base text-white/80 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium"
          style={{
            borderColor: '#FDDB00',
            background: selected ? '#FDDB00' : 'transparent',
            color: selected ? '#000' : '#FDDB00',
          }}
        >
          {letter}
        </span>
        {label}
      </button>
      {selected && extra}
    </div>
  )
}
