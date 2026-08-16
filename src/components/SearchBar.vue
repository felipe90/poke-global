<script setup lang="ts">
import { watch } from 'vue'

import { useDebouncedRef } from '@/composables/useDebouncedRef'
import { usePokemonStore } from '@/stores/pokemon'

const store = usePokemonStore()
const { value: query, debounced } = useDebouncedRef('')

watch(debounced, (value) => {
  store.searchFilter = value
})
</script>

<template>
  <label class="search-bar">
    <span class="search-bar__label">Buscar</span>
    <input
      v-model="query"
      class="search-bar__input"
      type="search"
      placeholder="Buscar Pokémon..."
    />
  </label>
</template>
