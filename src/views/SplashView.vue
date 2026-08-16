<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import PokeballLoader from '@/components/PokeballLoader.vue'
import { usePokemonStore } from '@/stores/pokemon'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const SPLASH_DURATION_MS = 1500

const router = useRouter()
const store = usePokemonStore()

const reducedMotion = ref(
  typeof window.matchMedia === 'function'
    ? window.matchMedia(REDUCED_MOTION_QUERY).matches
    : false,
)

let timer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  // Preload the first catalog page + type catalogs behind the splash so the
  // list is already populated when the user arrives. Both are idempotent.
  void store.loadFirstPage()
  void store.preloadTypes()

  timer = setTimeout(() => {
    void router.push('/onboarding')
  }, SPLASH_DURATION_MS)
})

onUnmounted(() => {
  if (timer !== undefined) clearTimeout(timer)
})
</script>

<template>
  <section
    class="splash-view"
    :data-reduced-motion="reducedMotion ? 'true' : undefined"
  >
    <PokeballLoader class="splash-view__loader" />
  </section>
</template>

<style scoped>
.splash-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  background: var(--bg);
}
</style>
