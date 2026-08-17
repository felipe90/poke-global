<script setup lang="ts">
import { computed } from 'vue'

import heartSolidIcon from '@/assets/icons/icon-heart-solid.svg'
import heartIcon from '@/assets/icons/icon-heart.svg'
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
</script>

<template>
  <button
    type="button"
    class="favorite-button"
    :class="`favorite-button--${size}`"
    :style="{ width: `${size}px`, height: `${size}px` }"
    :aria-pressed="isFavorite"
    :aria-label="isFavorite ? `Quitar ${name} de favoritos` : `Agregar ${name} a favoritos`"
    @click="toggle"
  >
    <img
      class="favorite-button__icon"
      :style="{ width: `${Math.round(size / 2)}px`, height: `${Math.round(size / 2)}px` }"
      :src="isFavorite ? heartSolidIcon : heartIcon"
      alt=""
      aria-hidden="true"
    />
  </button>
</template>
