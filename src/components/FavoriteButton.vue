<script setup lang="ts">
import { computed } from 'vue'

import heartSolidIcon from '@/assets/icons/heart/icon-heart-solid.svg'
import heartIcon from '@/assets/icons/heart/icon-heart.svg'
import { usePokemonStore } from '@/stores/pokemon'
import type { TypeName } from '@/types/pokemon'

const props = withDefaults(
  defineProps<{
    name: string
    id: number
    imageUrl: string
    types: TypeName[]
    /** Figma: 36×36 in the card, 28×28 in the detail header. */
    size?: number
    /** Renders the heart without any action (favorites list uses the trash). */
    disabled?: boolean
  }>(),
  { size: 36, disabled: false },
)

const store = usePokemonStore()

const isFavorite = computed(() => store.isFavorite(props.name))

function toggle(): void {
  if (props.disabled) return
  store.toggleFavorite({
    name: props.name,
    id: props.id,
    imageUrl: props.imageUrl,
    types: props.types,
  })
}

/** Heart SVG used as a CSS mask so the fill can be tinted via currentColor. */
const heartIconUrl = computed(() => (isFavorite.value ? heartSolidIcon : heartIcon))

/** Inline styles: the mask URL needs url("...") with quotes — built in JS. */
function buttonStyle(): Record<string, string> {
  return {
    width: `${props.size}px`,
    height: `${props.size}px`,
    '--favorite-icon': `url("${heartIconUrl.value}")`,
    color: isFavorite.value ? 'var(--favorite-active)' : '',
  }
}

function iconStyle(): Record<string, string> {
  return {
    width: `${Math.round(props.size / 2)}px`,
    height: `${Math.round(props.size / 2)}px`,
  }
}
</script>

<template>
  <button
    type="button"
    class="favorite-button"
    :class="{ 'favorite-button--active': isFavorite }"
    :style="buttonStyle()"
    :aria-pressed="isFavorite"
    :aria-label="isFavorite ? `Quitar ${name} de favoritos` : `Agregar ${name} a favoritos`"
    @click="toggle"
  >
    <span
      class="favorite-button__icon"
      :style="iconStyle()"
      aria-hidden="true"
    />
  </button>
</template>

<style scoped>
.favorite-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 2px solid var(--color-white);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
}

.favorite-button__icon {
  background-color: currentColor;
  -webkit-mask: var(--favorite-icon) center / contain no-repeat;
  mask: var(--favorite-icon) center / contain no-repeat;
}

.favorite-button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
</style>
