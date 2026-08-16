<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/AppButton.vue'
import ErrorState from '@/components/ErrorState.vue'
import PokeballLoader from '@/components/PokeballLoader.vue'
import PokemonDetailPanel from '@/components/PokemonDetailPanel.vue'
import { usePokemonStore } from '@/stores/pokemon'

const route = useRoute()
const router = useRouter()
const store = usePokemonStore()

const headingRef = ref<HTMLElement | null>(null)

const name = computed(() => {
  const param = route.params.name
  return typeof param === 'string' ? param : ''
})

const displayName = computed(() => name.value.charAt(0).toUpperCase() + name.value.slice(1))

const prevName = computed(() => store.prevName(name.value))
const nextName = computed(() => store.nextName(name.value))

function goTo(pokemon: string | null | undefined): void {
  if (!pokemon) return
  void router.push(`/pokemon/${pokemon}`)
}

/** Back to the previous route within the app; fall back to the list. */
function goBack(): void {
  if (router.options.history.state.back) {
    router.back()
  } else {
    void router.push('/')
  }
}

function retry(): void {
  if (name.value) void store.openDetail(name.value)
}

watch(
  () => route.params.name,
  async (param) => {
    const pokemon = typeof param === 'string' ? param : ''
    if (!pokemon) return
    await store.openDetail(pokemon)
    await nextTick()
    if (!store.detailError && !store.detailNotFound) headingRef.value?.focus()
  },
  { immediate: true },
)
</script>

<template>
  <div class="pokemon-detail-view">
    <div
      v-if="store.detailLoading"
      class="pokemon-detail-view__loading"
    >
      <PokeballLoader />
    </div>

    <section
      v-else-if="store.detailNotFound"
      class="not-found"
    >
      <h2 class="not-found__title">Pokémon no encontrado</h2>
      <p class="not-found__text">No existe un Pokémon con ese nombre.</p>
      <AppButton @click="router.push('/')">
        Volver a la Pokédex
      </AppButton>
    </section>

    <ErrorState
      v-else-if="store.detailError"
      @retry="retry"
    />

    <template v-else-if="store.selectedDetail">
      <h2
        ref="headingRef"
        tabindex="-1"
        class="detail-heading visually-hidden"
      >
        {{ displayName }}
      </h2>

      <PokemonDetailPanel
        :detail="store.selectedDetail"
        :derived="store.selectedSpecies"
        :prev-name="prevName"
        :next-name="nextName"
        @back="goBack"
        @prev="goTo(prevName)"
        @next="goTo(nextName)"
      />
    </template>
  </div>
</template>

<style scoped>
.pokemon-detail-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-card);
  min-height: 100%;
}

.pokemon-detail-view__loading {
  display: flex;
  justify-content: center;
  padding: var(--space-card) 0;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-card);
  padding: var(--space-card);
  border-radius: var(--radius-card);
  background: var(--bg);
}

.not-found__title {
  margin: 0;
  font-size: var(--font-screen-title);
  font-weight: 500;
  color: var(--title);
}

.not-found__text {
  margin: 0;
  font-size: var(--font-data-value);
  color: var(--subtitle);
}
</style>
