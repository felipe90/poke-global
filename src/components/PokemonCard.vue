<script setup lang="ts">
import { computed } from 'vue'

import { getTypeMeta } from '@/data/types'
import { usePokemonStore } from '@/stores/pokemon'
import type { PokemonSummary } from '@/types/pokemon'

import TypeBadge from './TypeBadge.vue'

const props = defineProps<{
  summary: PokemonSummary
  index?: number
  /** Ordered list captured as the nav context when the card is activated. */
  context?: string[]
}>()

const emit = defineEmits<{
  navigate: [name: string]
  activate: [name: string]
}>()

const store = usePokemonStore()

const ARTWORK_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/'

const id = computed(() => {
  const parsed = new URL(props.summary.url)
  const segments = parsed.pathname.split('/').filter(Boolean)
  return Number(segments[segments.length - 1])
})

const numero = computed(() => `Nº${String(id.value).padStart(3, '0')}`)

const displayName = computed(() => props.summary.name.charAt(0).toUpperCase() + props.summary.name.slice(1))

const types = computed(() => store.nameToTypes.get(props.summary.name) ?? [])

const background = computed(() => {
  const primary = types.value[0]
  if (!primary) return undefined
  return getTypeMeta(primary)?.color
})

const imageUrl = computed(() => (Number.isFinite(id.value) ? `${ARTWORK_BASE}${id.value}.png` : null))

function activate(): void {
  if (props.context && props.context.length > 0) {
    store.setNavContext(props.context)
  }
  emit('navigate', props.summary.name)
  emit('activate', props.summary.name)
}
</script>

<template>
  <button
    type="button"
    class="pokemon-card"
    :class="{ 'pokemon-card--loading': types.length === 0 }"
    :style="background ? { backgroundColor: background } : {}"
    :data-index="index"
    @click="activate"
  >
    <div class="pokemon-card__info">
      <span class="pokemon-card__number">{{ numero }}</span>
      <h3 class="pokemon-card__name">{{ displayName }}</h3>
      <div
        v-if="types.length > 0"
        class="pokemon-card__types"
      >
        <TypeBadge
          v-for="type in types"
          :key="type"
          :type="type"
        />
      </div>
    </div>
    <img
      v-if="imageUrl"
      class="pokemon-card__image"
      :src="imageUrl"
      :alt="summary.name"
    />
  </button>
</template>

<style scoped>
.pokemon-card {
  color: #fff;
  border: none;
  text-align: left;
  background: var(--bg);
}

.pokemon-card__number {
  font-size: var(--font-number);
  font-weight: 600;
}

.pokemon-card__name {
  margin: 0;
  font-size: var(--font-card-name);
  font-weight: 600;
}

.pokemon-card__types {
  display: flex;
  flex-wrap: wrap;
}

.pokemon-card__image {
  width: 96px;
  height: 96px;
  object-fit: contain;
  pointer-events: none;
}

.pokemon-card:focus-visible {
  outline: 2px solid var(--title);
  outline-offset: 2px;
}
</style>
