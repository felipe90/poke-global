<script setup lang="ts">
import { computed, watch } from 'vue'

import searchIcon from '@/assets/icons/search.svg'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
import { usePokemonStore } from '@/stores/pokemon'

const emit = defineEmits<{ 'open-filter': [] }>()

const store = usePokemonStore()
const { value: query, debounced } = useDebouncedRef('')

watch(debounced, (value) => {
  store.searchFilter = value
})

const filterActive = computed(() => store.appliedTypes.length > 0)

/** Result count shown under the search when a query or filter is active. */
const resultCount = computed<number | null>(() => {
  if (store.searchFilter.trim() !== '') return store.filteredList.length
  if (filterActive.value) return store.filteredSet.length
  return null
})

const countPrefix = computed(() => (resultCount.value === 1 ? 'Se ha encontrado' : 'Se han encontrado'))

function clearFilter(): void {
  store.clearFilter()
}
</script>

<template>
  <div class="search-bar">
    <div class="search-bar__row">
      <div class="search-bar__field">
        <img
          class="search-bar__icon"
          :src="searchIcon"
          alt=""
          aria-hidden="true"
        />
        <input
          v-model="query"
          class="search-bar__input"
          type="search"
          placeholder="Buscar Pokémon..."
          aria-label="Buscar Pokémon"
        />
      </div>
      <button
        type="button"
        class="search-bar__filter"
        aria-label="Abrir filtros"
        @click="emit('open-filter')"
      >
        <img
          class="search-bar__filter-icon"
          :src="searchIcon"
          alt=""
          aria-hidden="true"
        />
      </button>
    </div>

    <div
      v-if="resultCount !== null"
      class="search-bar__results"
      aria-live="polite"
    >
      <p class="search-bar__count">
        <span class="search-bar__count-text">{{ countPrefix }}</span
        ><strong class="search-bar__count-strong">
          {{ ' ' + resultCount }} resultado{{ resultCount === 1 ? '' : 's' }}
        </strong>
      </p>
      <button
        v-if="filterActive"
        type="button"
        class="search-bar__clear"
        @click="clearFilter"
      >
        Borrar filtro
      </button>
    </div>
  </div>
</template>