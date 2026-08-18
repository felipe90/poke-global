<script setup lang="ts">
/**
 * Two-layer swipe-to-reveal wrapper. The default slot (the card) sits on top
 * of the action layer and is translated horizontally by the swipe gesture;
 * the action layer below reveals a destructive action. Tapping it emits
 * `delete`. While a swipe is open (`swiped`), a click captured on the front
 * layer is swallowed so that releasing the gesture does not navigate.
 */
import { ref } from 'vue'

import trashIcon from '@/assets/icons/tab/trash.svg'
import { useSwipeReveal } from '@/composables/useSwipeReveal'

const emit = defineEmits<{
  delete: []
}>()

const containerRef = ref<HTMLElement | null>(null)

/** Full reveal = the card's own width (the card travels to the app's left edge). */
const { translateX, isSwiping, swiped, handlers } = useSwipeReveal(
  () => containerRef.value?.offsetWidth ?? 0,
)

function onCardClickCapture(event: Event): void {
  // A click right after releasing a swipe (browser synthesizes one) must not
  // navigate to the detail. Block it WITHOUT closing the reveal — the swipe
  // stays open until the action is tapped or the card is dragged again.
  if (swiped.value) {
    event.stopPropagation()
    event.preventDefault()
    swiped.value = false
  }
}
</script>

<template>
  <div
    ref="containerRef"
    class="swipe-container"
    :class="{ 'swipe-container--active': translateX !== 0 || isSwiping, 'is-swiping': isSwiping }"
  >
    <div
      class="action-layer"
      role="button"
      aria-label="Eliminar de favoritos"
      @click="emit('delete')"
    >
      <slot name="actions">
        <span class="swipe-trash">
          <img
            class="swipe-trash__icon"
            :src="trashIcon"
            alt=""
            aria-hidden="true"
          />
        </span>
      </slot>
    </div>
    <div
      class="card-layer"
      :class="{ 'is-swiping': isSwiping }"
      :style="{ transform: `translateX(${translateX}px)` }"
      v-bind="handlers"
      @click.capture="onCardClickCapture"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.swipe-container {
  position: relative;
  width: 100%;
  border-radius: var(--radius-lg);
  overflow: hidden;
  user-select: none;
  touch-action: pan-y;
  /* Smooth the container's width/radius expansion when it breaks out of the
     app padding on swipe (margin + width + border-radius). Ease-in-out and
     slightly longer than the old 0.25s so the expansion feels soft; it must
     match the card timing so both move in sync on open and close. */
  transition: margin 0.35s cubic-bezier(0.42, 0, 0.58, 1),
    width 0.35s cubic-bezier(0.42, 0, 0.58, 1),
    border-radius 0.35s cubic-bezier(0.42, 0, 0.58, 1);
}

/* During the drag, the container follows the finger instantly (no expansion
   tween while the card is also translating); the smooth expansion/radius
   plays on release via the base transition above. */
.swipe-container.is-swiping {
  transition: none;
}

/* While swiping or open, the container breaks out of .app-main's 16px side
   padding and spans the full app width, so the card's leading edge slides
   past the app boundary and clips. All corners become square (straight
   edges) — the reveal is full-bleed, not a rounded chip. */
.swipe-container--active {
  width: calc(100% + 2 * var(--space-card));
  margin-inline: calc(-1 * var(--space-card));
  border-radius: 0;
}

/* The red action layer is a full-height rectangle pinned to the RIGHT side
   only (the revealed action area) — not the whole container. That way, when
   the container expands into the left margin on swipe, there is no red there
   to peek through before the card covers it. The parent's overflow clips it. */
.action-layer {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 30%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 20px;
  background: #d32f2f;
  border-radius: 0;
  margin: 0;
}

.swipe-trash {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
  cursor: pointer;
}

.swipe-trash__icon {
  width: 38px;
  height: 38px;
}

.card-layer {
  position: relative;
  z-index: var(--layer-sticky);
  will-change: transform;
  border-radius: var(--radius-lg);
  /* Matches the container timing so the card and the expanding container
     move in sync on open and close (smooth, ease-in-out). */
  transition: transform 0.35s cubic-bezier(0.42, 0, 0.58, 1);
}

.card-layer.is-swiping {
  transition: none;
}
</style>