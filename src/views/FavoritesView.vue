<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import EmptyState from '@/components/EmptyState.vue'
import { usePokemonStore } from '@/stores/pokemon'
import type { FavoritePokemon } from '@/types/pokemon'

const router = useRouter()
const store = usePokemonStore()

const favorites = computed(() => store.favorites)

function displayName(favorite: FavoritePokemon): string {
  return favorite.name.charAt(0).toUpperCase() + favorite.name.slice(1)
}

function goDetail(name: string): void {
  void router.push(`/pokemon/${name}`)
}

function remove(name: string): void {
  store.removeFavorite(name)
}
</script>

<template>
  <div class="favorites-view">
    <EmptyState v-if="favorites.length === 0" />

    <ul
      v-else
      class="favorites-list"
    >
      <li
        v-for="favorite in favorites"
        :key="favorite.name"
        class="favorites-list__item"
      >
        <button
          type="button"
          class="favorite-card"
          @click="goDetail(favorite.name)"
        >
          <img
            v-if="favorite.imageUrl"
            class="favorite-card__image"
            :src="favorite.imageUrl"
            :alt="favorite.name"
          />
          <span class="favorite-card__name">{{ displayName(favorite) }}</span>
        </button>
        <button
          type="button"
          class="favorite-trash"
          :aria-label="`Quitar ${favorite.name} de favoritos`"
          :style="{ color: '#cd3131' }"
          @click="remove(favorite.name)"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M3 6h18" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.favorites-view {
  min-height: 100%;
}

.favorites-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-card);
  margin: 0;
  padding: 0;
  list-style: none;
}

.favorites-list__item {
  display: flex;
  align-items: center;
  gap: var(--space-card);
  padding: var(--space-card);
  border-radius: var(--radius-card);
  background: var(--bg);
}

.favorite-card {
  display: flex;
  align-items: center;
  flex: 1;
  gap: var(--space-card);
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.favorite-card__image {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.favorite-card__name {
  font-size: var(--font-card-name);
  font-weight: 600;
  color: var(--title);
}

.favorite-card:focus-visible,
.favorite-trash:focus-visible {
  outline: 2px solid var(--title);
  outline-offset: 2px;
}

.favorite-trash {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-info-gap);
  border: none;
  background: transparent;
  cursor: pointer;
}

@media (min-width: 640px) {
  .favorites-list {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
