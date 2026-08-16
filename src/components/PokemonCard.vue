<script setup lang="ts">
import { computed } from 'vue'

import { FALLBACK_TYPE_COLOR, getTypeMeta } from '@/data/types'
import { usePokemonStore } from '@/stores/pokemon'
import type { FavoritePokemon, PokemonSummary, TypeName } from '@/types/pokemon'

import FavoriteButton from './FavoriteButton.vue'
import TypeBadge from './TypeBadge.vue'

const props = defineProps<{
  /** Catalog source (list view). */
  summary?: PokemonSummary
  /** Persisted snapshot source (favorites view). */
  favorite?: FavoritePokemon
  index?: number
  /** Ordered list captured as the nav context when the card is activated. */
  context?: string[]
}>()

const emit = defineEmits<{
  navigate: [name: string]
  activate: [name: string]
}>()

const store = usePokemonStore()

/** Standard sprite base — the same URL that the API exposes as `sprites.front_default`. */
const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'

const id = computed(() => {
  if (props.favorite) return props.favorite.id
  if (!props.summary) return NaN
  const parsed = new URL(props.summary.url)
  const segments = parsed.pathname.split('/').filter(Boolean)
  return Number(segments[segments.length - 1])
})

const numero = computed(() => `Nº${String(id.value).padStart(3, '0')}`)

const name = computed(() => props.favorite?.name ?? props.summary?.name ?? '')

const displayName = computed(() => name.value.charAt(0).toUpperCase() + name.value.slice(1))

/** Types come from the persisted snapshot (favorites) or the preload map (list). */
const types = computed<TypeName[]>(() => {
  if (props.favorite) return props.favorite.types
  if (!props.summary) return []
  return store.nameToTypes.get(props.summary.name) ?? []
})

const background = computed(() => {
  const primary = types.value[0]
  if (!primary) return undefined
  return getTypeMeta(primary)?.color ?? FALLBACK_TYPE_COLOR
})

const imageUrl = computed(() => {
  if (props.favorite) return props.favorite.imageUrl || null
  return Number.isFinite(id.value) ? `${SPRITE_BASE}${id.value}.png` : null
})

function activate(): void {
  if (props.context && props.context.length > 0) {
    store.setNavContext(props.context)
  }
  emit('navigate', name.value)
  emit('activate', name.value)
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
    <FavoriteButton
      class="pokemon-card__favorite"
      :name="name"
      :id="id"
      :image-url="imageUrl ?? ''"
      :types="types"
      @click.stop
    />
    <img
      v-if="imageUrl"
      class="pokemon-card__image"
      :src="imageUrl"
      :alt="name"
    />
  </button>
</template>

<style scoped>
.pokemon-card {
  position: relative;
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

.pokemon-card__favorite {
  position: absolute;
  top: var(--space-info-gap);
  right: var(--space-info-gap);
  padding: var(--space-info-gap);
}

.pokemon-card__favorite:focus-visible {
  outline: 2px solid var(--bg);
  outline-offset: 2px;
}

.pokemon-card:focus-visible {
  outline: 2px solid var(--title);
  outline-offset: 2px;
}
</style>
