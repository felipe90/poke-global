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
  }>(),
  { size: 36 },
)

const store = usePokemonStore()

const isFavorite = computed(() => store.isFavorite(props.name))

function toggle(): void {
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
    color: isFavorite.value ? '#e53935' : '',
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
