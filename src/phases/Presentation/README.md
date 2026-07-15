# Presentation Phase

This folder contains the host-controlled presentation phase used in the pilot demo.
It is built around one image per slide, with optional display extras layered on top.

## What It Does

- `host` controls next/previous and can advance the presentation phase.
- `central` mirrors the slide full-screen.
- `player` is passive and only sees the presentation output.
- Slide timing is local to the device, so the timer is used for presentation pacing and confirmation prompts, not as a server-authoritative phase timer.

## How Slides Are Modeled

Each slide in `src/lib/demoBundle.ts` has:

- a normal presentation block with the image asset
- a matching entry in `presentationSlideExtras`

The `blocks` field stays simple and only carries the image.
The presentation-only extras live outside the schema so we can change the visual layout without depending on a schema field order.

### Supported Extras

- `title`
  - Short heading for the slide.
- `details`
  - `{ heading, body }`
  - Switches the slide into a details-focused layout.
- `timer`
  - `{ seconds, direction }`
  - `direction` can be `down` or `up`.
- `style`
  - `timer-emphasis`
  - `detail-emphasis`

## Layout Rules

The renderer chooses between two main presentation styles when `details` exists:

### 1. Timer Emphasis

Used when the slide should feel like a countdown or timed prompt.

- Timer is the visual focus.
- Details sit in a lower card or footer area.
- Best for questions, timed reflection, or pacing the room.

### 2. Detail Emphasis

Used when the content needs more reading space and the sidebar should lead.

- Image sits on the left.
- Details live in a right-side dark panel.
- Timer, if present, appears above the details box.

When `details` is not present, the phase falls back to the overlay style:

- `title` becomes a small badge in the corner.
- `timer` is shown as a centered overlay card when present.

## Demo Slide Matrix

The demo bundle includes a full set of examples so each presentation possibility is visible.

| Slide      | Combination                     | Style           |
| ---------- | ------------------------------- | --------------- |
| `slide-1`  | image only                      | overlay         |
| `slide-2`  | image + title                   | overlay         |
| `slide-3`  | image + details                 | detail-emphasis |
| `slide-4`  | image + title + details + timer | timer-emphasis  |
| `slide-5`  | image + timer                   | overlay         |
| `slide-6`  | image + title + timer           | overlay         |
| `slide-7`  | image + title + details + timer | detail-emphasis |
| `slide-8`  | image + details + timer         | timer-emphasis  |
| `slide-9`  | image + title + details + timer | timer-emphasis  |
| `slide-10` | image + title + details + timer | detail-emphasis |

## Files

- [`index.tsx`](./index.tsx) - presentation phase entry point
- [`SlideSurface.tsx`](./SlideSurface.tsx) - layout selector for the active slide
- [`layouts/CentralTimerDetailsSlide.tsx`](./layouts/CentralTimerDetailsSlide.tsx) - timer-heavy central layout
- [`layouts/SplitSidebarSlide.tsx`](./layouts/SplitSidebarSlide.tsx) - detail-heavy sidebar layout
- [`layouts/StackedOverlaySlide.tsx`](./layouts/StackedOverlaySlide.tsx) - player/host stacked overlay variant
- [`layouts/CornerOverlaySlide.tsx`](./layouts/CornerOverlaySlide.tsx) - title/timer overlay fallback
- [`PlayerPane.tsx`](./PlayerPane.tsx) - player passive view

## Authoring Notes

- If you add a new presentation slide, create the image slide in `content.slides` and the matching extras entry in `presentationSlideExtras`.
- Keep `blocks` focused on the slide image.
- Use `style` to force a specific presentation version when you want the timer and details to feel intentionally different.

## Timer Behavior

- The timer is used to block silent advancement when a slide is still in progress.
- The host can still advance early, but the app shows a confirmation dialog first.
- Leaving a slide and returning to it restarts the timer from full.
