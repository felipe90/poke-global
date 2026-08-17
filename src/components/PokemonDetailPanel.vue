<script setup lang="ts">
import { computed } from 'vue'

import { FALLBACK_TYPE_COLOR, getTypeMeta, resolveWeaknesses } from '@/data/types'
import { getOfficialArtwork, statsToPokemonStats } from '@/services/pokeapi'
import { deriveSpecies, usePokemonStore } from '@/stores/pokemon'
import type { PokemonDerivedSpecies } from '@/stores/pokemon'
import type { PokemonDetail, PokemonSpecies, TypeName } from '@/types/pokemon'

import FavoriteButton from './FavoriteButton.vue'
import ShareButton from './ShareButton.vue'
import TypeBadge from './TypeBadge.vue'

const props = defineProps<{
  detail: PokemonDetail
  species?: PokemonSpecies | null
  derived?: PokemonDerivedSpecies | null
  /** Adjacent pokémon in the nav context; null/undefined disables the control. */
  prevName?: string | null
  nextName?: string | null
}>()

const store = usePokemonStore()

const emit = defineEmits<{
  back: []
  prev: []
  next: []
  toggleFavorite: []
  share: []
}>()

const numero = computed(() => `Nº${String(props.detail.id).padStart(3, '0')}`)

const displayName = computed(() => props.detail.name.charAt(0).toUpperCase() + props.detail.name.slice(1))

const typesBySlot = computed(() => [...props.detail.types].sort((a, b) => a.slot - b.slot))

const fields = computed(() => {
  const resolveWeaknessesFor = (type: TypeName): TypeName[] => resolveWeaknesses(type, store.typeCatalog(type))
  return props.derived ?? deriveSpecies(props.detail, props.species ?? null, resolveWeaknessesFor)
})

const artwork = computed(() => props.detail.sprites.front_default ?? getOfficialArtwork(props.detail))

const favoriteTypes = computed(() => props.detail.types.map((entry) => entry.type.name))

/** Header circle background = the color of the pokémon's first (primary) type. */
const headerColor = computed(() => {
  const primary = props.detail.types[0]?.type.name
  return primary ? getTypeMeta(primary)?.color ?? FALLBACK_TYPE_COLOR : undefined
})

const stats = computed(() => statsToPokemonStats(props.detail.stats))

const statRows = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: 'Attack' },
  { key: 'defense', label: 'Defense' },
  { key: 'special-attack', label: 'Sp. Atk' },
  { key: 'special-defense', label: 'Sp. Def' },
  { key: 'speed', label: 'Speed' },
] as const
</script>

<template>
  <article class="detail-panel">
    <header class="detail-header">
      <div
        class="detail-header__circle"
        :style="headerColor ? { backgroundColor: headerColor } : {}"
        aria-hidden="true"
      ></div>

      <div class="detail-header__top">
        <button
          type="button"
          class="detail-header__back"
          aria-label="Volver"
          @click="emit('back')"
        >
          <svg
            width="38"
            height="38"
            viewBox="0 0 38 38"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M24 10 L13 19 L24 28"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <FavoriteButton
          :name="detail.name"
          :id="detail.id"
          :image-url="artwork ?? ''"
          :types="favoriteTypes"
          :size="28"
          @click="emit('toggleFavorite')"
        />
      </div>

      <img
        v-if="artwork"
        class="detail-header__artwork"
        :src="artwork"
        :alt="detail.name"
      />

      <nav
        class="detail-header__nav"
        aria-label="Navegación entre Pokémon"
      >
        <button
          type="button"
          class="nav-button nav-prev"
          :disabled="!prevName"
          :aria-label="prevName ? `Anterior: ${prevName}` : 'Anterior no disponible'"
          @click="emit('prev')"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M15 5 L8 12 L15 19"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          class="nav-button nav-next"
          :disabled="!nextName"
          :aria-label="nextName ? `Próximo: ${nextName}` : 'Próximo no disponible'"
          @click="emit('next')"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M9 5 L16 12 L9 19"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </nav>
    </header>

    <section class="detail-body">
      <div class="detail-heading">
        <h2 class="detail-heading__name">{{ displayName }}</h2>
        <span class="detail-heading__number">{{ numero }}</span>
      </div>

      <div class="detail-elements">
        <TypeBadge
          v-for="entry in typesBySlot"
          :key="entry.slot"
          :type="entry.type.name"
        />
      </div>

      <div class="detail-description-block">
        <p class="detail-description">{{ fields.descripcion }}</p>
        <hr
          class="detail-divider"
          aria-hidden="true"
        />
      </div>

      <dl class="detail-characteristics">
        <div class="detail-characteristics__row">
          <div class="detail-field">
            <dt class="detail-field__label">Peso</dt>
            <dd class="detail-field__value">{{ fields.peso }}</dd>
          </div>
          <div class="detail-field">
            <dt class="detail-field__label">Altura</dt>
            <dd class="detail-field__value">{{ fields.altura }}</dd>
          </div>
        </div>
        <div class="detail-characteristics__row">
          <div class="detail-field">
            <dt class="detail-field__label">Categoría</dt>
            <dd class="detail-field__value">{{ fields.categoria }}</dd>
          </div>
          <div class="detail-field">
            <dt class="detail-field__label">Habilidad</dt>
            <dd class="detail-field__value">{{ fields.habilidad }}</dd>
          </div>
        </div>
        <div class="detail-characteristics__row">
          <div class="detail-field">
            <dt class="detail-field__label">Género</dt>
            <dd class="detail-field__value">{{ fields.genero }}</dd>
          </div>
        </div>
      </dl>

      <section
        v-if="fields.debilidades.length > 0"
        class="detail-weaknesses"
        aria-label="Debilidades"
      >
        <h3 class="detail-weaknesses__title">Debilidades</h3>
        <div class="detail-weaknesses__chips">
          <TypeBadge
            v-for="type in fields.debilidades"
            :key="type"
            :type="type"
          />
        </div>
      </section>

      <section
        class="detail-stats"
        aria-label="Estadísticas base"
      >
        <h3 class="detail-stats__title">Estadísticas</h3>
        <div
          v-for="row in statRows"
          :key="row.key"
          class="detail-panel__stat-row"
        >
          <span class="detail-panel__stat-label">{{ row.label }}</span>
          <span class="detail-panel__stat-value">{{ stats[row.key] }}</span>
        </div>
      </section>

      <ShareButton
        :detail="detail"
        @click="emit('share')"
      />
    </section>
  </article>
</template>

<style scoped>
.detail-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-card);
}

/* ---------------------------------------------------------------- Header */

.detail-header {
  position: relative;
  height: 307px;
  overflow: hidden;
}

.detail-header__circle {
  position: absolute;
  top: -96px;
  left: 50%;
  width: 498px;
  height: 498px;
  border-radius: 50%;
  transform: translateX(-50%);
}

.detail-header__top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-card);
  color: var(--bg);
}

.detail-header__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--bg);
  cursor: pointer;
}

.detail-header__back:focus-visible {
  outline: 2px solid var(--bg);
  outline-offset: 2px;
}

.detail-header__artwork {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 142px;
  height: 155px;
  object-fit: contain;
  transform: translate(-50%, -58%);
}

.detail-header__nav {
  position: absolute;
  bottom: var(--space-card);
  left: 50%;
  display: flex;
  gap: var(--space-card);
  transform: translateX(-50%);
}

.nav-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: var(--color-white);
  color: var(--title);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
  cursor: pointer;
}

.nav-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.nav-button:focus-visible {
  outline: 2px solid var(--title);
  outline-offset: 2px;
}

/* ------------------------------------------------------------------ Body */

.detail-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-card);
}

.detail-heading {
  display: flex;
  flex-direction: column;
}

.detail-heading__name {
  margin: 0;
  font-size: var(--font-detail-name);
  font-weight: 500;
  color: var(--title);
}

.detail-heading__number {
  margin: -4px 0 0;
  font-size: var(--font-size-md);
  font-weight: 500;
  color: var(--subtitle);
}

.detail-elements {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.detail-description-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-card);
}

.detail-description {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: 400;
  color: var(--subtitle);
}

.detail-divider {
  margin: 0;
  border: none;
  border-top: 1px solid var(--progress-track);
}

.detail-characteristics {
  display: flex;
  flex-direction: column;
  gap: var(--space-card);
  margin: 0;
}

.detail-characteristics__row {
  display: flex;
  gap: var(--space-card);
}

.detail-characteristics__row > .detail-field {
  flex: 1 1 0;
}

.detail-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-info-gap);
}

.detail-field__label {
  margin: 0;
  font-size: var(--font-data-label);
  font-weight: 500;
  color: var(--subtitle);
}

.detail-field__value {
  margin: 0;
  font-size: var(--font-data-value);
  font-weight: 500;
  color: var(--title);
}

.detail-weaknesses {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-weaknesses__title {
  margin: 0;
  font-size: 27px;
  font-weight: 500;
  color: var(--title);
}

.detail-weaknesses__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-info-gap);
}

.detail-stats {
  display: flex;
  flex-direction: column;
  gap: var(--space-info-gap);
}

.detail-stats__title {
  margin: 0 0 var(--space-info-gap);
  font-size: 27px;
  font-weight: 500;
  color: var(--title);
}

.detail-panel__stat-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-card);
  padding: var(--space-info-gap) 0;
  border-bottom: 1px solid var(--progress-track);
}

.detail-panel__stat-label {
  font-size: var(--font-data-label);
  font-weight: 500;
  color: var(--subtitle);
}

.detail-panel__stat-value {
  font-size: var(--font-data-value);
  font-weight: 500;
  color: var(--title);
}
</style>
