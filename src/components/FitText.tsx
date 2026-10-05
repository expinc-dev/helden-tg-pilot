import { type CSSProperties, type ReactNode, useLayoutEffect, useRef } from 'react'

// Text that always fits its box: starts at `baseVw` (the Figma size, in vw so it
// scales with the projector) and steps the font down until the content no
// longer overflows the box's height, but never below `minRatio` of the base.
// For projector screens that cannot scroll, where authored copy (long prompts /
// answer options) must be shrunk rather than clipped or pushed off screen.
//
// The box is the element that is measured, so give it a bounded height: either a
// flex child (`min-h-0 flex-1`) or a `max-h-*` — a short text then keeps its
// natural height and Figma size, a long one shrinks inside the cap.
export function FitText({
  baseVw,
  minRatio = 0.45,
  centerY = false,
  className = '',
  style,
  children,
}: {
  baseVw: number
  minRatio?: number
  // Vertically centre the text when it is shorter than the box.
  centerY?: boolean
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const box = boxRef.current
    const inner = innerRef.current
    if (!box || !inner) return
    const fit = () => {
      const base = (window.innerWidth * baseVw) / 100
      let scale = 1
      inner.style.fontSize = `${base}px`
      while (inner.scrollHeight > box.clientHeight + 1 && scale > minRatio) {
        scale = Math.max(minRatio, scale - 0.04)
        inner.style.fontSize = `${base * scale}px`
      }
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(box)
    return () => ro.disconnect()
  }, [baseVw, minRatio, children])

  return (
    <div
      ref={boxRef}
      className={`min-h-0 overflow-hidden ${centerY ? 'flex flex-col justify-center' : ''} ${className}`}
      style={style}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  )
}
