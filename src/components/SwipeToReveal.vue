<script setup lang="ts">
/**
 * Two-layer swipe-to-reveal wrapper. The default slot (the card) sits on top
 * of the action layer and is translated horizontally by the swipe gesture;
 * the action layer below reveals a destructive action. Tapping it emits
 * `delete`. While a swipe is open (`swiped`), a click captured on the front
 * layer is swallowed so that releasing the gesture does not navigate.
 */
import { useSwipeReveal } from '@/composables/useSwipeReveal'

const emit = defineEmits<{
  delete: []
}>()

const { translateX, isSwiping, swiped, handlers } = useSwipeReveal()

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
  <div class="swipe-container">
    <div
      class="action-layer"
      @click="emit('delete')"
    >
      <slot name="actions">
        <span class="swipe-trash">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            role="img"
            aria-label="Eliminar de favoritos"
          >
            <path d="M3 6h18" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
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
  overflow: hidden;
  border-radius: var(--radius-lg);
  user-select: none;
  touch-action: pan-y;
}

.action-layer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: var(--space-lg);
  background: #d32f2f;
  border-radius: var(--radius-lg);
}

.swipe-trash {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
  cursor: pointer;
}

.card-layer {
  position: relative;
  z-index: 2;
  will-change: transform;
  border-radius: var(--radius-lg);
  transition: transform 0.25s cubic-bezier(0.25, 1, 0.5, 1);
}

.card-layer.is-swiping {
  transition: none;
}
</style>