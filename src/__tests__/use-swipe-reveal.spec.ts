import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MAX_SWIPE, THRESHOLD, useSwipeReveal } from '@/composables/useSwipeReveal'

/** Minimal PointerEvent shape consumed by the composable handlers. */
type PointerLike = {
  clientX: number
  clientY: number
  pointerId: number
  currentTarget?: EventTarget | null
}

function pointer(overrides: Partial<PointerLike> = {}): PointerLike {
  return { clientX: 0, clientY: 0, pointerId: 1, currentTarget: null, ...overrides }
}

describe('useSwipeReveal', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /** onPointerUp defers the destination transform to the next rAF frame —
   *  advance the (fake) animation frame so the snap/spring applies. */
  function settle(): void {
    vi.advanceTimersByTime(16)
  }

  it('opens fully when the horizontal drag passes the threshold', () => {
    const { translateX, isSwiping, swiped, handlers } = useSwipeReveal()

    handlers.onPointerdown(pointer({ clientX: 200, clientY: 100 }) as PointerEvent)
    expect(isSwiping.value).toBe(true)

    handlers.onPointermove(pointer({ clientX: 140, clientY: 103 }) as PointerEvent)
    expect(translateX.value).toBe(-60)
    expect(translateX.value).toBeLessThan(THRESHOLD)

    handlers.onPointerup(pointer() as PointerEvent)
    expect(isSwiping.value).toBe(false)
    settle()
    expect(translateX.value).toBe(MAX_SWIPE)
    expect(swiped.value).toBe(true)
  })

  it('springs back to 0 when the drag stays below the threshold', () => {
    const { translateX, swiped, handlers } = useSwipeReveal()

    handlers.onPointerdown(pointer({ clientX: 200, clientY: 100 }) as PointerEvent)
    handlers.onPointermove(pointer({ clientX: 170, clientY: 102 }) as PointerEvent)
    expect(translateX.value).toBe(-30)
    expect(translateX.value).toBeGreaterThanOrEqual(THRESHOLD)

    handlers.onPointerup(pointer() as PointerEvent)
    settle()
    expect(translateX.value).toBe(0)
    expect(swiped.value).toBe(false)
  })

  it('releases the swiped flag after the click-lock window', () => {
    const { swiped, handlers } = useSwipeReveal()

    handlers.onPointerdown(pointer({ clientX: 200, clientY: 100 }) as PointerEvent)
    handlers.onPointermove(pointer({ clientX: 120, clientY: 100 }) as PointerEvent)
    handlers.onPointerup(pointer() as PointerEvent)
    settle()
    expect(swiped.value).toBe(true)

    vi.advanceTimersByTime(299)
    expect(swiped.value).toBe(true)

    vi.advanceTimersByTime(1)
    expect(swiped.value).toBe(false)
  })

  it('reset() snaps back to 0 and clears swiped and isSwiping', () => {
    const { translateX, isSwiping, swiped, handlers, reset } = useSwipeReveal()

    handlers.onPointerdown(pointer({ clientX: 200, clientY: 100 }) as PointerEvent)
    handlers.onPointermove(pointer({ clientX: 120, clientY: 100 }) as PointerEvent)
    handlers.onPointerup(pointer() as PointerEvent)
    settle()
    expect(swiped.value).toBe(true)

    reset()
    expect(translateX.value).toBe(0)
    expect(swiped.value).toBe(false)
    expect(isSwiping.value).toBe(false)
  })

  it('ignores vertical-dominated motion so the scroll container keeps scrolling', () => {
    const { translateX, handlers } = useSwipeReveal()

    handlers.onPointerdown(pointer({ clientX: 200, clientY: 100 }) as PointerEvent)
    handlers.onPointermove(pointer({ clientX: 195, clientY: 160 }) as PointerEvent)
    expect(translateX.value).toBe(0)

    handlers.onPointerup(pointer() as PointerEvent)
    settle()
    expect(translateX.value).toBe(0)
  })

  it('ignores tiny horizontal jitter below the axis-noise threshold', () => {
    const { translateX, handlers } = useSwipeReveal()

    handlers.onPointerdown(pointer({ clientX: 200, clientY: 100 }) as PointerEvent)
    handlers.onPointermove(pointer({ clientX: 197, clientY: 100 }) as PointerEvent)
    expect(translateX.value).toBe(0)
  })

  it('clamps the drag to the elastic limit and never reveals to the right', () => {
    const { translateX, handlers } = useSwipeReveal()

    handlers.onPointerdown(pointer({ clientX: 200, clientY: 100 }) as PointerEvent)
    handlers.onPointermove(pointer({ clientX: 20, clientY: 100 }) as PointerEvent)
    expect(translateX.value).toBe(MAX_SWIPE - 20)

    handlers.onPointermove(pointer({ clientX: 260, clientY: 100 }) as PointerEvent)
    expect(translateX.value).toBe(0)
  })
})