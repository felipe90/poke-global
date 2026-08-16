<script setup lang="ts">
import { computed } from 'vue'

import { deriveSpecies } from '@/stores/pokemon'
import type { PokemonDerivedSpecies } from '@/stores/pokemon'
import { getOfficialArtwork, statsToPokemonStats } from '@/services/pokeapi'
import type { PokemonDetail, PokemonSpecies } from '@/types/pokemon'

import FavoriteButton from './FavoriteButton.vue'
import ShareButton from './ShareButton.vue'
import TypeBadge from './TypeBadge.vue'

const props = defineProps<{
  detail: PokemonDetail
  species?: PokemonSpecies | null
  derived?: PokemonDerivedSpecies | null
}>()

const emit = defineEmits<{
  toggleFavorite: []
  share: []
}>()

const numero = computed(() => `Nº${String(props.detail.id).padStart(3, '0')}`)

const displayName = computed(() => props.detail.name.charAt(0).toUpperCase() + props.detail.name.slice(1))

const typesBySlot = computed(() => [...props.detail.types].sort((a, b) => a.slot - b.slot))

const fields = computed(() => props.derived ?? deriveSpecies(props.detail, props.species ?? null))

const artwork = computed(() => getOfficialArtwork(props.detail) ?? props.detail.sprites.front_default)

const favoriteTypes = computed(() => props.detail.types.map((entry) => entry.type.name))

const stats = computed(() => statsToPokemonStats(props.detail.stats))

const statRows = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: 'Attack' },
  { key: 'defense', label: 'Defense' },
  { key: 'special-attack', label: 'Sp. Atk' },
  { key: 'special-defense', label: 'Sp. Def' },
  { key: 'speed', label: 'Speed' },
] as const

const dataRows = [
  { label: 'Peso', value: computed(() => fields.value.peso) },
  { label: 'Altura', value: computed(() => fields.value.altura) },
  { label: 'Categoría', value: computed(() => fields.value.categoria) },
  { label: 'Habilidad', value: computed(() => fields.value.habilidad) },
  { label: 'Género', value: computed(() => fields.value.genero) },
]
</script>

<template>
  <article class="detail-panel">
    <header class="detail-panel__header">
      <div class="detail-panel__heading">
        <span class="detail-panel__number">{{ numero }}</span>
        <h2 class="detail-panel__name">{{ displayName }}</h2>
      </div>
      <FavoriteButton
        :name="detail.name"
        :id="detail.id"
        :image-url="artwork ?? ''"
        :types="favoriteTypes"
        @click="emit('toggleFavorite')"
      />
    </header>

    <img
      v-if="artwork"
      class="detail-panel__artwork"
      :src="artwork"
      :alt="detail.name"
    />

    <p class="detail-panel__description">{{ fields.descripcion }}</p>

    <div class="detail-panel__types">
      <TypeBadge
        v-for="entry in typesBySlot"
        :key="entry.slot"
        :type="entry.type.name"
      />
    </div>

    <dl class="detail-panel__data">
      <div
        v-for="row in dataRows"
        :key="row.label"
        class="detail-panel__data-row"
      >
        <dt class="detail-panel__data-label">{{ row.label }}</dt>
        <dd class="detail-panel__data-value">{{ row.value.value }}</dd>
      </div>
    </dl>

    <section
      v-if="fields.debilidades.length > 0"
      class="detail-panel__weaknesses"
      aria-label="Debilidades"
    >
      <h3 class="detail-panel__section-title">Debilidades</h3>
      <div class="detail-panel__types">
        <TypeBadge
          v-for="type in fields.debilidades"
          :key="type"
          :type="type"
        />
      </div>
    </section>

    <section
      class="detail-panel__stats"
      aria-label="Estadísticas base"
    >
      <h3 class="detail-panel__section-title">Estadísticas</h3>
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
  </article>
</template>

<style scoped>
.detail-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-card);
}

.detail-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-card);
}

.detail-panel__number {
  font-size: var(--font-data-label);
  font-weight: 600;
  color: var(--subtitle);
}

.detail-panel__name {
  margin: 0;
  font-size: var(--font-detail-name);
  font-weight: 500;
  color: var(--title);
}

.detail-panel__artwork {
  width: 200px;
  height: 200px;
  margin: 0 auto;
  object-fit: contain;
}

.detail-panel__description {
  margin: 0;
  font-size: var(--font-data-value);
  font-weight: 400;
  color: var(--subtitle);
}

.detail-panel__types {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-info-gap);
}

.detail-panel__data {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-card);
  margin: 0;
}

.detail-panel__data-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-info-gap);
}

.detail-panel__data-label {
  font-size: var(--font-data-label);
  font-weight: 500;
  color: var(--subtitle);
}

.detail-panel__data-value {
  margin: 0;
  font-size: var(--font-data-value);
  font-weight: 500;
  color: var(--title);
}

.detail-panel__section-title {
  margin: 0 0 var(--space-info-gap);
  font-size: var(--font-data-label);
  font-weight: 500;
  color: var(--subtitle);
}

.detail-panel__stats {
  display: flex;
  flex-direction: column;
  gap: var(--space-info-gap);
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
