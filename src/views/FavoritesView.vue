<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import chevronLeftIcon from '@/assets/icons/tab/chevron-left.svg'
import EmptyState from '@/components/EmptyState.vue'
import PokemonCard from '@/components/PokemonCard.vue'
import SwipeToReveal from '@/components/SwipeToReveal.vue'
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
        <SwipeToReveal
          class="favorites-list__card"
          @delete="remove(favorite.name)"
        >
          <PokemonCard
            :favorite="favorite"
            :context="navContext"
            favorite-disabled
            navigate-disabled
          />
        </SwipeToReveal>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.favorites-view {
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
}

/* Header: back button left, centered title (3-col grid keeps it centered).
   Full frame width — breaks out of .app-main's 16px side padding. */
.page-header {
  position: sticky;
  top: 0;
  /* Above the sticky layer (cards use --layer-sticky) so the header always
     covers them while the list scrolls underneath. */
  z-index: var(--layer-header);
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  gap: var(--space-xxs);
  margin-inline: calc(-1 * var(--space-card));
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
  width: 100%;
}

/* The swipe container manages its own width (100% idle, full-bleed +32px
   when open) — do not override it here. */
.favorites-list__card {
  display: block;
}
</style>