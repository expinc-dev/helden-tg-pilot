import { mmss } from '@/lib/sync/timermath'
import type { useSlideTimer } from '@/lib/sync/useCentralStepTimer'

import type { Role } from '../../PhaseRouter'
import { CentralTimerDetailsSlide } from './layouts/CentralTimerDetailsSlide'
import { CornerOverlaySlide } from './layouts/CornerOverlaySlide'
import { SplitSidebarSlide } from './layouts/SplitSidebarSlide'
import { StackedOverlaySlide } from './layouts/StackedOverlaySlide'
import type { PresentationSlideExtras } from './presentationSlideExtras'

export function SlideSurface({
  image,
  extras,
  timerState,
  role,
}: {
  image?: string
  extras: PresentationSlideExtras
  timerState: ReturnType<typeof useSlideTimer>
  role: Role
}) {
  const timerText =
    timerState.active &&
    mmss(timerState.direction === 'up' ? timerState.elapsedSec : timerState.remainingSec)

  const isTimerSlide = timerState.active
  const presentationStyle = extras.style ?? (isTimerSlide ? 'timer-emphasis' : 'detail-emphasis')

  if (extras.details) {
    if (role === 'central') {
      if (presentationStyle === 'timer-emphasis') {
        return (
          <CentralTimerDetailsSlide
            image={image}
            title={extras.title}
            details={extras.details}
            timerText={timerText}
          />
        )
      }
      return (
        <SplitSidebarSlide
          image={image}
          title={extras.title}
          details={extras.details}
          timerText={timerText}
        />
      )
    }
    return (
      <StackedOverlaySlide
        image={image}
        heading={extras.title ?? extras.details.heading}
        body={extras.details.body}
        timerText={timerText}
        isTimerSlide={isTimerSlide}
      />
    )
  }
  return <CornerOverlaySlide image={image} title={extras.title} timerText={timerText} />
}
