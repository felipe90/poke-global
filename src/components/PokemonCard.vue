<script setup lang="ts">
import { computed } from 'vue'

import { FALLBACK_TYPE_COLOR, darkenColor, getTypeMeta, lightenColor } from '@/data/types'
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

const baseColor = computed(() => {
  const primary = types.value[0]
  if (!primary) return FALLBACK_TYPE_COLOR
  return getTypeMeta(primary)?.color ?? FALLBACK_TYPE_COLOR
})

/** Card background: the type color lightened (Figma render uses a light tint). */
const background = computed(() => lightenColor(baseColor.value, 0.5))

/** Media-section background: the type color darkened (interior card). */
const mediaBackground = computed(() => darkenColor(baseColor.value, 0.08))

/** Decorative Figma element graphic behind the sprite (by primary type). */
const elementUrl = computed(() => {
  const primary = types.value[0]
  if (!primary) return null
  return getTypeMeta(primary)?.element ?? null
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
      <div class="pokemon-card__text">
        <span class="pokemon-card__number">{{ numero }}</span>
        <h3 class="pokemon-card__name">{{ displayName }}</h3>
      </div>
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
    <div
      class="pokemon-card__media"
      :style="{ backgroundColor: mediaBackground }"
    >
      <img
        v-if="elementUrl"
        class="pokemon-card__element"
        :src="elementUrl"
        alt=""
        aria-hidden="true"
      />
      <img
        v-if="imageUrl"
        class="pokemon-card__image"
        :src="imageUrl"
        :alt="name"
      />
      <FavoriteButton
        class="pokemon-card__favorite"
        :name="name"
        :id="id"
        :image-url="imageUrl ?? ''"
        :types="types"
        @click.stop
      />
    </div>
  </button>
</template>

<style scoped>
.pokemon-card {
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: stretch;
  gap: var(--space-sm);
  color: #fff;
  border: none;
  text-align: left;
  background: var(--bg);
  border-radius: 16px;
  min-height: 102px;
  padding: 0 0 0 var(--space-card);
}

.pokemon-card__info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2px;
  flex: 1;
  min-width: 0;
  padding: var(--space-card) 0;
}

.pokemon-card__text {
  display: flex;
  flex-direction: column;
}

.pokemon-card__number {
  font-size: var(--font-number);
  font-weight: 600;
  color: var(--subtitle);
}

.pokemon-card__name {
  margin: -2px 0 0;
  font-size: var(--font-card-name);
  font-weight: 600;
  line-height: 1.2;
  color: var(--title);
}

.pokemon-card__types {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 8px;
}

.pokemon-card__media {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 126px;
  min-height: 102px;
  border-radius: 16px;
  padding: 4px 16px;
  flex-shrink: 0;
  align-self: stretch;
}

.pokemon-card__element {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.pokemon-card__image {
  position: relative;
  width: 94px;
  height: 94px;
  object-fit: contain;
  pointer-events: none;
}

.pokemon-card__favorite {
  position: absolute;
  top: 12px;
  right: 12px;
}

.pokemon-card:focus-visible {
  outline: 2px solid var(--title);
  outline-offset: 2px;
}
</style>
