<script setup lang="ts">
import { computed, watch } from 'vue'

import searchIcon from '@/assets/icons/tab/search.svg'
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

<style scoped>
.search-bar {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding-top: 48px;
  padding-bottom: var(--space-lg);
}

.search-bar__row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.search-bar__field {
  position: relative;
  flex: 1;
}

.search-bar__icon {
  position: absolute;
  top: 50%;
  left: var(--space-card);
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  pointer-events: none;
}

.search-bar__input {
  width: 100%;
  height: 48px;
  padding: 14px var(--space-card) 14px 44px;
  border: 1.5px solid var(--border-default, #e0e0e0);
  border-radius: 30px;
  background: var(--color-white);
  color: var(--title);
  font-family: var(--font-family);
  font-size: var(--font-search);
  font-weight: 400;
}

.search-bar__input::placeholder {
  color: var(--text-disabled, #9e9e9e);
  font-family: var(--font-family);
  font-weight: 400;
  font-size: var(--font-search);
  line-height: 100%;
  letter-spacing: 0;
}

.search-bar__input:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}

.search-bar__filter {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 48px;
  padding: 14px var(--space-card);
  border: 1.5px solid var(--border-default, #e0e0e0);
  border-radius: 30px;
  background: var(--color-white);
  cursor: pointer;
}

.search-bar__filter-icon {
  width: 20px;
  height: 20px;
}

.search-bar__filter:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}

.search-bar__results {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  min-height: 22px;
}

.search-bar__count {
  margin: 0;
  height: 22px;
  font-family: var(--font-family-montserrat);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-md);
  letter-spacing: 0;
  color: var(--text-disabled, #9e9e9e);
}

.search-bar__count-text {
  font-weight: 500;
}

.search-bar__count-strong {
  font-weight: 700;
}

.search-bar__clear {
  border: none;
  background: none;
  padding: 0;
  font-family: var(--font-family-montserrat);
  font-weight: 500;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-md);
  letter-spacing: 0;
  color: var(--text-link, #1e88e5);
  text-decoration: underline;
  text-decoration-style: solid;
  text-decoration-offset: 0%;
  text-decoration-thickness: 0%;
  text-decoration-skip-ink: auto;
  cursor: pointer;
}

.search-bar__clear:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  border-radius: var(--radius-lg);
}
</style>