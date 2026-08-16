<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import ErrorState from '@/components/ErrorState.vue'
import PokeballLoader from '@/components/PokeballLoader.vue'
import PokemonCard from '@/components/PokemonCard.vue'
import SearchBar from '@/components/SearchBar.vue'
import TypeFilterSheet from '@/components/TypeFilterSheet.vue'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { usePokemonStore } from '@/stores/pokemon'
import { PAGE_SIZE } from '@/types/pokemon'

const router = useRouter()
const store = usePokemonStore()

const sheetOpen = ref(false)

const filterActive = computed(() => store.appliedTypes.length > 0)

const hasMoreFiltered = computed(
  () => (store.filterSliceIndex + 1) * PAGE_SIZE < store.filteredSet.length,
)

function countMessage(n: number): string {
  return n === 1 ? 'Se ha encontrado 1 resultado' : `Se han encontrado ${n} resultados`
}

const countText = computed(() => {
  if (store.searchFilter.trim() !== '') return countMessage(store.filteredList.length)
  if (filterActive.value) return countMessage(store.filteredSet.length)
  return ''
})

/** Ordered list captured as the nav context when a card is activated. */
const navContext = computed(() => {
  if (filterActive.value) return store.filteredSet.map((item) => item.name)
  return store.filteredList.map((item) => item.name)
})

const showErrorState = computed(() => store.pageError?.offset === 0 && store.pokemonList.length === 0)

const showMoreError = computed(() => {
  const error = store.pageError
  return error !== null && error.offset > 0 && store.pokemonList.length > 0
})

function retryFirstPage(): void {
  void store.retryPage(0)
}

function retryMore(): void {
  if (store.pageError) void store.retryPage(store.pageError.offset)
}

function goDetail(name: string): void {
  void router.push(`/pokemon/${name}`)
}

const { sentinel, observe, disconnect } = useInfiniteScroll({
  enabled: computed(() => !store.applyingFilter),
  loadingMore: computed(() => store.loadingMore || store.loadingFirst || store.applyingFilter),
  hasMore: computed(() => (filterActive.value ? hasMoreFiltered.value : store.nextUrl !== null)),
  onLoadMore: () => {
    if (filterActive.value) {
      store.incrementFilterSlice()
    } else {
      void store.loadMore()
    }
  },
})

watch(sentinel, (element) => {
  if (element) observe()
  else disconnect()
})

onBeforeUnmount(disconnect)

onMounted(() => {
  if (store.pokemonList.length === 0) {
    void store.loadFirstPage()
  }
  void store.preloadTypes()
})
</script>

<template>
  <div
    class="pokedex-list-view"
    :aria-busy="store.loadingFirst || store.loadingMore"
  >
    <div class="pokedex-list-view__toolbar">
      <SearchBar />
      <div class="pokedex-list-view__actions">
        <button
          type="button"
          class="filter-control"
          @click="sheetOpen = true"
        >
          Filtrar
        </button>
        <button
          v-if="filterActive"
          type="button"
          class="clear-filter"
          @click="store.clearFilter()"
        >
          Borrar filtro
        </button>
      </div>
    </div>

    <p
      v-if="countText"
      class="result-count"
      aria-live="polite"
    >
      {{ countText }}
    </p>

    <PokeballLoader
      v-if="store.loadingFirst"
      class="list-loader"
    />

    <ErrorState
      v-else-if="showErrorState"
      @retry="retryFirstPage"
    />

    <template v-else>
      <ul class="pokemon-grid">
        <li
          v-for="(item, index) in store.filteredList"
          :key="item.name"
          class="pokemon-grid__cell"
        >
          <PokemonCard
            :summary="item"
            :index="index"
            :context="navContext"
            @navigate="goDetail"
          />
        </li>
      </ul>

      <div
        ref="sentinel"
        class="list-sentinel"
        aria-hidden="true"
      />

      <div
        v-if="showMoreError"
        class="sentinel-error"
        role="alert"
      >
        <p class="sentinel-error__text">Algo salió mal...</p>
        <button
          type="button"
          class="sentinel-error__retry"
          @click="retryMore"
        >
          Reintentar
        </button>
      </div>
    </template>

    <TypeFilterSheet
      :open="sheetOpen"
      :applied="store.appliedTypes"
      @apply="sheetOpen = false"
      @close="sheetOpen = false"
    />
  </div>
</template>

<style scoped>
.pokedex-list-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-card);
  min-height: 100%;
}

.pokedex-list-view__toolbar {
  display: flex;
  flex-direction: column;
  gap: var(--space-card);
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--bg);
  padding-bottom: var(--space-info-gap);
}

.pokedex-list-view__actions {
  display: flex;
  gap: var(--space-info-gap);
}

.filter-control,
.clear-filter {
  padding: var(--space-info-gap) var(--space-card);
  border: none;
  border-radius: var(--radius-pill);
  background: var(--primary);
  color: var(--bg);
  font-size: var(--font-data-value);
  font-weight: 600;
}

.filter-control:focus-visible,
.clear-filter:focus-visible {
  outline: 2px solid var(--title);
  outline-offset: 2px;
}

.result-count {
  margin: 0;
  font-size: var(--font-data-label);
  font-weight: 500;
  color: var(--subtitle);
}

.pokemon-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-card);
  margin: 0;
  padding: 0;
  list-style: none;
}

.pokemon-grid__cell {
  min-width: 0;
}

.list-sentinel {
  height: 1px;
}

.sentinel-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-info-gap);
  padding: var(--space-card);
  border-radius: var(--radius-card);
  background: var(--bg);
}

.sentinel-error__text {
  margin: 0;
  font-size: var(--font-data-value);
  font-weight: 600;
  color: var(--danger);
}

.sentinel-error__retry {
  padding: var(--space-info-gap) var(--space-card);
  border: none;
  border-radius: var(--radius-pill);
  background: var(--primary);
  color: var(--bg);
  font-size: var(--font-data-value);
  font-weight: 600;
}

.sentinel-error__retry:focus-visible {
  outline: 2px solid var(--title);
  outline-offset: 2px;
}

@media (min-width: 640px) {
  .pokemon-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
