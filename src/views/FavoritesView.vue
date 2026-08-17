<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import chevronLeftIcon from '@/assets/icons/tab/chevron-left.svg'
import EmptyState from '@/components/EmptyState.vue'
import PokemonCard from '@/components/PokemonCard.vue'
import { usePokemonStore } from '@/stores/pokemon'

const router = useRouter()
const store = usePokemonStore()

const favorites = computed(() => store.favorites)

/** Ordered favorite names captured as the nav context when a card is activated. */
const navContext = computed(() => favorites.value.map((favorite) => favorite.name))

function goBack(): void {
  if (router.options.history.state.back) {
    router.back()
  } else {
    void router.push('/')
  }
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
    <header class="page-header">
      <button
        type="button"
        class="page-header__back"
        aria-label="Volver"
        @click="goBack"
      >
        <img
          :src="chevronLeftIcon"
          alt=""
          aria-hidden="true"
        />
      </button>
      <h1 class="page-header__title">Favoritos</h1>
      <div
        class="page-header__spacer"
        aria-hidden="true"
      />
    </header>

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
        <PokemonCard
          :favorite="favorite"
          :context="navContext"
          favorite-disabled
          class="favorites-list__card"
          @navigate="goDetail"
        />
        <button
          type="button"
          class="favorite-trash"
          :aria-label="`Quitar ${favorite.name} de favoritos`"
          :style="{ color: 'var(--danger)' }"
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
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Header: back button left, centered title (3-col grid keeps it centered). */
.page-header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  gap: var(--space-xxs);
  padding: var(--space-2xl) var(--space-md);
  background: var(--surface-default);
}

.page-header__back {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--title);
  cursor: pointer;
}

.page-header__back:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  border-radius: var(--radius-lg);
}

.page-header__title {
  margin: 0;
  font-family: var(--font-family-montserrat);
  font-size: var(--font-size-lg);
  font-weight: 600;
  line-height: var(--line-height-lg);
  letter-spacing: 0;
  color: var(--title);
  text-align: center;
}

.page-header__spacer {
  width: 40px;
}

.favorites-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-card);
  margin: 0;
  padding: 0;
  width: 100%;
  list-style: none;
}

.favorites-list__item {
  display: flex;
  align-items: center;
  gap: var(--space-info-gap);
  width: 100%;
}

.favorites-list__card {
  flex: 1;
  min-width: 0;
}

.favorite-trash {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-card);
  border: none;
  background: transparent;
  cursor: pointer;
}

.favorite-trash:focus-visible {
  outline: 2px solid var(--title);
  outline-offset: 2px;
}
</style>