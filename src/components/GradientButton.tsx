import type { ButtonHTMLAttributes } from 'react'

export function GradientButton({
  className = '',
  style,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-[8px] font-semibold text-black transition disabled:opacity-50 ${className}`}
      style={{ background: 'linear-gradient(120deg, #FDDB00 14.62%, #FDA400 68.41%)', ...style }}
    />
  )
}
