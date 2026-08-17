/**
 * Horizontal swipe-to-reveal gesture, driven by Pointer Events so it works
 * for both mouse and touch. Drags left to reveal a fixed offset; a release
 * beyond the threshold snaps open (and flags `swiped`), otherwise it springs
 * back. Vertical drags — and horizontal motion that does not dominate — are
 * left untouched so the app-shell scroll container keeps scrolling natively.
 */
import { ref } from 'vue'

/** Fully revealed offset in px (the width of the revealed action layer). */
export const MAX_SWIPE = -80
/** Offset below which a release snaps open instead of closing. */
export const THRESHOLD = -40
/** Horizontal delta that must dominate the vertical one before a drag counts. */
const AXIS_DOMINANCE = 5
/** Extra room dragged beyond the reveal so the gesture feels elastic. */
const ELASTIC_PADDING = 20
/** How long an open swipe blocks clicks before they pass through again. */
const SWIPED_LOCK_MS = 300

export function useSwipeReveal() {
  const translateX = ref(0)
  const isSwiping = ref(false)
  const swiped = ref(false)

  let startX = 0
  let startY = 0
  let pointerId: number | null = null
  let lockTimer: ReturnType<typeof setTimeout> | null = null

  function clearLockTimer(): void {
    if (lockTimer !== null) {
      clearTimeout(lockTimer)
      lockTimer = null
    }
  }

  function onPointerDown(event: PointerEvent): void {
    clearLockTimer()
    startX = event.clientX
    startY = event.clientY
    pointerId = event.pointerId
    isSwiping.value = true
    const target = event.currentTarget as HTMLElement | null
    if (typeof target?.setPointerCapture === 'function') {
      target.setPointerCapture(event.pointerId)
    }
  }

  function onPointerMove(event: PointerEvent): void {
    if (!isSwiping.value || event.pointerId !== pointerId) return
    const dx = event.clientX - startX
    const dy = event.clientY - startY
    // Vertical scroll wins: only intercept once the horizontal motion clearly
    // dominates the vertical one and has moved past the axis-noise threshold.
    if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) <= AXIS_DOMINANCE) return
    translateX.value = Math.max(MAX_SWIPE - ELASTIC_PADDING, Math.min(0, dx))
  }

  function onPointerUp(_event?: PointerEvent): void {
    if (!isSwiping.value) return
    isSwiping.value = false
    pointerId = null
    // Re-enable the transition in THIS frame, then apply the destination
    // transform on the NEXT frame (rAF). Doing both in the same tick makes
    // the browser see the new transform under the just-restored transition
    // and snap instead of animating (the classic swipe-release jump).
    const shouldOpen = translateX.value < THRESHOLD
    requestAnimationFrame(() => {
      if (shouldOpen) {
        translateX.value = MAX_SWIPE
        swiped.value = true
        clearLockTimer()
        lockTimer = setTimeout(() => {
          swiped.value = false
          lockTimer = null
        }, SWIPED_LOCK_MS)
      } else {
        translateX.value = 0
      }
    })
  }

  function reset(): void {
    clearLockTimer()
    isSwiping.value = false
    pointerId = null
    translateX.value = 0
    swiped.value = false
  }

  function close(): void {
    clearLockTimer()
    translateX.value = 0
    swiped.value = false
  }

  /**
   * Event handler keys are lowercase (`onPointerdown`, not `onPointerDown`):
   * Vue hyphenates v-bind object keys, and `onPointerDown` would resolve to
   * the event name "pointer-down", which never matches a real pointerdown.
   */
  const handlers = {
    onPointerdown: onPointerDown,
    onPointermove: onPointerMove,
    onPointerup: onPointerUp,
  }

  return { translateX, isSwiping, swiped, handlers, reset, close }
}