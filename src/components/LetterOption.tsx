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
      className="flex flex-col gap-3 overflow-hidden rounded border p-4 transition"
      style={{
        borderColor: selected ? '#FDDB00' : '#353535',
        background: selected ? 'rgba(253, 219, 0, 0.05)' : 'transparent',
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="flex w-full items-center gap-4 text-left text-base leading-[1.2] text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span
          className="flex size-[30px] shrink-0 items-center justify-center rounded-full border p-0.5 text-lg leading-[23px] tracking-[-0.04em]"
          style={{
            borderColor: '#FDDB00',
            // Selected: gold-gradient disc with a medium-weight black letter.
            backgroundImage: selected
              ? 'linear-gradient(120deg, rgb(253, 219, 0) 14.619%, rgb(253, 164, 0) 68.407%)'
              : undefined,
            color: selected ? '#000' : '#CCCCCC',
            fontWeight: selected ? 500 : 300,
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
