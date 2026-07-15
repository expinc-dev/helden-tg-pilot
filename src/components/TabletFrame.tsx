import { OrientationGuard } from './OrientationGuard'

// Simulates a portrait-tablet viewport when a phone/tablet page is opened on a
// desktop. Below lg (<1024px, real phones/tablets) this is a pure passthrough —
// the page renders full-bleed as normal. At lg+ it centers the page inside a
// fixed 768px-wide tablet frame on a dark backdrop, scrolling internally.
// Central is the big-screen role and is intentionally never wrapped in this.
//
// OrientationGuard is co-located here so every portrait-role route inherits the
// landscape overlay for free; central skips it because it never gets wrapped.
export function TabletFrame({ children }: { children: React.ReactNode }) {
  return (
    <OrientationGuard>
      <div className="lg:flex lg:min-h-screen lg:items-center lg:justify-center lg:bg-neutral-100 lg:p-4">
        <div className="lg:h-[1024px] lg:max-h-[calc(100vh-2rem)] lg:w-[768px] lg:max-w-full lg:overflow-y-auto lg:rounded-[2.5rem] lg:shadow-2xl lg:ring-1 lg:ring-white/10">
          {children}
        </div>
      </div>
    </OrientationGuard>
  )
}
